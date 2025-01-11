const FamilyTreeRepository = require('../repositories/FamilyTreeRepository');
const PersonNodeRepository = require('../repositories/PersonNodeRepository');
const PersonRepository = require('../repositories/PersonRepository');
const UserRepository = require('../repositories/UserRepository');
const RelationshipService = require('./RelationshipService');
const MatchService = require('./MatchService');
const NotificationService = require('./NotificationService');
const PersonNodeService = require('./PersonNodeService');
const ImageService = require('./ImageService');

class TreeService {
    static async createFamilyTree(userId) {
        const familyTree = await FamilyTreeRepository.createFamilyTree({ owner: userId });
        return familyTree;
    }

    static async addRoot(familyTreeId, nodeId) {
        const familyTree = await FamilyTreeRepository.updateFamilyTreeRoot(familyTreeId, nodeId);
        return familyTree;
    }

    static async getTree(userId) {
        const familyTree = await FamilyTreeRepository.getFamilyTreeByUserId(userId);
       
        if (!familyTree) {
            throw new Error('Family tree not found');
        }

        // Transform profile picture filenames to signed URLs
        await this.transformProfilePictureUrls(familyTree.root);

        return familyTree;
    }

    /**
     * Recursively transform profile picture filenames to signed URLs
     * @param {Object} node - The current person node
     */
    static async transformProfilePictureUrls(node) {
        if (!node) return;

        // If node has a person and profile picture, transform the filename to a signed URL
        if (node.person && node.person.profilePicture) {
            try {
                // Replace profilePicture filename with signed URL
                node.person.profilePicture = await ImageService.getImageUrl(node.person.profilePicture);
            } catch (error) {
                console.error(`Error getting signed URL for ${node.person.profilePicture}:`, error);
                node.person.profilePicture = null;
            }
        }

        // Recursively process children
        if (node.children && node.children.length > 0) {
            for (const childNode of node.children) {
                await this.transformProfilePictureUrls(childNode);
            }
        }
    }

    static async requestConnectPersonToUser(gUserID, userId, nodeId) {
        const sender = await UserRepository.populatePersonFields(gUserID);
        if (!sender) {
            throw new Error('Sender not found');
        }

        await NotificationService.createNotification(userId, `${sender.person.generalInformation.firstName} ${sender.person.generalInformation.lastName} wants to connect with you on Ancestree!`, 'CONNECT', nodeId);
        
        return { message: 'Connection request sent successfully' };
    }

    static async acceptConnectionRequest(userId, nodeId) {
        const userAccepter = await UserRepository.populatePersonFields(userId);
        if (!userAccepter) {
            throw new Error('User not found');
        }

        const personNode = await PersonNodeRepository.getPersonNodeById(nodeId, ['person']);
        if (!personNode) {
            throw new Error('Person node not found');
        }

        const person = await PersonRepository.createPerson(personNode.person);
        if (!person) {
            throw new Error('Person not found');
        }

        const familyTree = await FamilyTreeRepository.getFamilyTreeById(person.treeId);
        if (!familyTree) {
            throw new Error('Family tree not found');
        }

        const user = await UserRepository.populatePersonFields(familyTree.owner);
        if (!user) {
            throw new Error('User not found');
        }

        await NotificationService.createNotification(userId, `You are now connected with ${user.person.generalInformation.firstName} ${user.person.generalInformation.lastName} on Ancestree!`, 'GENERAL', user._id);

        await NotificationService.createNotification(user._id, `You are now connected with ${person.generalInformation.firstName} ${person.generalInformation.lastName} on Ancestree!`, 'GENERAL', userId);
        
        await PersonRepository.updateRelatedUser(person._id, userId);
        return { message: 'Connection request accepted successfully' };
    }

    static async addChild(treeId, nodeId, childDetails, gUserID) {
        try {
            childDetails.treeId = treeId;
            const familyTree = await FamilyTreeRepository.getFamilyTreeById(treeId);
            if (!familyTree) {
                throw new Error('Family tree not found');
            }

            const parentNode = await PersonNodeRepository.getPersonNodeById(nodeId, ['person', 'children', 'parents']);
            if (!parentNode) {
                throw new Error('Parent node not found');
            }

            let childPerson = await PersonRepository.createPerson(childDetails);
            let childNode = await PersonNodeRepository.getPersonNodeByPersonId(childPerson._id, ['person', 'parents']);

            if (!childNode) {
                childNode = await PersonNodeRepository.createPersonNode({
                    person: childPerson._id,
                    parents: [nodeId],
                    children: [],
                    familyTree: treeId
                });
            } else {
                await PersonNodeRepository.addParentToNode(childNode, nodeId);
            }

            await PersonNodeRepository.addChildToNode(parentNode, childNode._id);
            await this.handleSiblingRelationships(parentNode, childNode);

            const potentialMatch = await MatchService.checkForPotentialMatch(childDetails, childNode, treeId);
            if (potentialMatch.length > 0) {
                await MatchService.notifyMatchUsers(gUserID, childNode, potentialMatch);
                return {
                    message: 'Child added successfully. Potential match found in another user\'s tree.',
                    potentialMatch
                };
            }

            return { message: 'Child added successfully', parentNode, childNode };
        } catch (error) {
            console.error('Error in addChild:', error);
            throw error;
        }
    }

    static async addParent(treeId, nodeId, parentDetails, gUserID) {
        try {
            parentDetails.treeId = treeId;
            const familyTree = await FamilyTreeRepository.getFamilyTreeById(treeId);
            if (!familyTree) {
                throw new Error('Family tree not found');
            }

            const childNode = await PersonNodeRepository.getPersonNodeById(nodeId, ['person', 'parents']);
            if (!childNode) {
                throw new Error('Child node not found');
            }

            if (childNode.parents.length >= 2) {
                throw new Error('Cannot add more than two parents');
            }

            let parentPerson = await PersonRepository.createPerson(parentDetails);
            let parentNode = await PersonNodeRepository.getPersonNodeByPersonId(parentPerson._id, ['person', 'children']);

            if (!parentNode) {
                parentNode = await PersonNodeRepository.createPersonNode({
                    person: parentPerson._id,
                    children: [childNode._id],
                    familyTree: treeId
                });
            } else {
                await PersonNodeRepository.addChildToNode(parentNode, childNode._id);
            }

            await PersonNodeRepository.addParentToNode(childNode, parentNode._id);

            if (String(familyTree.root) === String(childNode._id)) {
                await FamilyTreeRepository.updateFamilyTreeRoot(treeId, parentNode._id);
            }

            const potentialMatch = await MatchService.checkForPotentialMatch(parentDetails, parentNode, treeId);
            if (potentialMatch.length > 0) {
                await MatchService.notifyMatchUsers(gUserID, parentNode, potentialMatch);
                return {
                    message: 'Parent added successfully. Potential match found in another user\'s tree.',
                    potentialMatch
                };
            }

            return { message: 'Parent added successfully', parentNode, childNode };
        } catch (error) {
            console.error('Error in addParent:', error);
            throw error;
        }
    }

    static async checkRelationship(referenceId, destinationId) {
        try {
            if (!referenceId || !destinationId) {
                throw new Error('Invalid request parameters');
            }
            
            const referenceNode = await PersonNodeRepository.getPersonNodeById(referenceId, ['person', 'parents', 'children']);
            const destinationNode = await PersonNodeRepository.getPersonNodeById(destinationId, ['person', 'parents', 'children']);
            
            if (!referenceNode || !destinationNode) {
                throw new Error('Node(s) not found');
            }

            const relationshipType = await RelationshipService.determineRelationship(referenceNode, destinationNode);
            return { message: 'Relationship determined successfully', relationshipType };
        } catch (error) {
            console.error('Error in checkRelationship:', error);
            throw error;
        }
    }

    static async handleSiblingRelationships(parentNode, childNode) {
        for (const sibling of parentNode.children) {
            const siblingNode = await PersonNodeRepository.getPersonNodeById(sibling._id, ['person', 'parents']);
            if (siblingNode.parents.length === 2) {
                const otherParentNode = siblingNode.parents.find(parent => !parent._id.equals(parentNode._id));
                if (otherParentNode) {
                    await PersonNodeRepository.addChildToNode(otherParentNode, childNode._id);
                    await PersonNodeRepository.addParentToNode(childNode, otherParentNode._id);
                }
            }
        }
    }
}

module.exports = TreeService;
