const PersonNodeRepository = require('../repositories/PersonNodeRepository');
const PersonRepository = require('../repositories/PersonRepository');
const UserRepository = require('../repositories/UserRepository');
const FamilyTreeRepository = require('../repositories/FamilyTreeRepository');
const NotificationService = require('./NotificationService');

class MatchService {
    static async checkForPotentialMatch(personDetails, newNode, userTreeId) {
        const allUsers = await UserRepository.getAllUsers();
        const potentialMatches = [];
        
        for (const user of allUsers) {
            const userTree = await FamilyTreeRepository.getFamilyTreeByUserId(user._id);
            if (userTree) {
                const similarPersons = await this.findSimilarPersonInTree(userTreeId, personDetails);
                
                for (const existingPerson of similarPersons) {
                    const existingNode = await PersonNodeRepository.getPersonNodeByPersonId(existingPerson._id, ['parents', 'children']);
                    const hasCommonRelatives = await this.checkForCommonRelatives(newNode, existingNode);
                    
                    const userPerson = await PersonRepository.getPersonById(user.person._id);
                    const potentialMatch = {
                        userData: {
                            userId: user._id,
                            firstName: userPerson.generalInformation.firstName,
                            lastName: userPerson.generalInformation.lastName
                        },
                        personData: {
                            personId: existingPerson._id,
                            treeId: existingPerson.treeId,
                            firstName: existingPerson.generalInformation.firstName,
                            lastName: existingPerson.generalInformation.lastName,
                            hasCommonRelatives
                        }
                    };

                    const isDuplicate = potentialMatches.some(match => 
                        match.personData.personId.toString() === potentialMatch.personData.personId.toString() &&
                        match.personData.treeId.toString() === potentialMatch.personData.treeId.toString()
                    );

                    if (!isDuplicate) {
                        potentialMatches.push(potentialMatch);
                    }
                }
            }
        }
        
        return potentialMatches;
    }

    static async findSimilarPersonInTree(treeId, personDetails) {
        const similarPersons = await PersonRepository.findSimilarPersons(personDetails);
        const filteredPersons = similarPersons.filter(person => person.treeId && person.treeId.toString() !== treeId);
        return filteredPersons;
    }

    static async checkForCommonRelatives(newNode, existingNode) {
        const newNodeRelatives = [...newNode.parents, ...newNode.children];
        const existingNodeRelatives = [...existingNode.parents, ...existingNode.children];
        
        for (const newRelative of newNodeRelatives) {
            const newRelativeNode = await PersonNodeRepository.getPersonNodeById(newRelative._id || newRelative, ['person']);
            const newRelativePerson = newRelativeNode.person;

            for (const existingRelative of existingNodeRelatives) {
                const existingRelativeNode = await PersonNodeRepository.getPersonNodeById(existingRelative._id || existingRelative, ['person']);
                const existingRelativePerson = existingRelativeNode.person;

                if (this.comparePersonDetails(newRelativePerson, existingRelativePerson)) {
                    return true;
                }
            }
        }
        
        return false; 
    }

    static comparePersonDetails(person1, person2) {
        const firstNameMatch = person1.generalInformation.firstName.trim().toLowerCase() === person2.generalInformation.firstName.trim().toLowerCase();
        const lastNameMatch = person1.generalInformation.lastName.trim().toLowerCase() === person2.generalInformation.lastName.trim().toLowerCase();
        const birthdateMatch = 
            person1.generalInformation.birthdate && person2.generalInformation.birthdate 
            && new Date(person1.generalInformation.birthdate).getTime() === new Date(person2.generalInformation.birthdate).getTime();

        return firstNameMatch && lastNameMatch && birthdateMatch;
    }

    static async notifyMatchUsers(gUserID, newNode, potentialMatches) {
        const notificationPromises = [];

        // Notify the user adding the person
        notificationPromises.push(
            NotificationService.createNotification(gUserID, 'A potential match was found on another user\'s tree.', 'MATCH', newNode._id )
        );

        // Notify all potential matches
        potentialMatches.forEach(match => {
            notificationPromises.push(
                NotificationService.createNotification(match.userData.userId, 'A potential match was found in your family tree!', 'MATCH', gUserID )
            );
        });

        await Promise.all(notificationPromises);
    }
}

module.exports = MatchService;
