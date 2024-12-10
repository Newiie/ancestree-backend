const PersonNodeRepository = require('../repositories/PersonNodeRepository');

class RelationshipService {
    static async isAncestor(ancestorId, node, generation = 1) {
        if (node.parents.length === 0) return false;

        for (const parent of node.parents) {
            const fullParentNode = await PersonNodeRepository.getPersonNodeById(parent._id || parent, ['parents', 'person']);
            if (fullParentNode._id.toString() === ancestorId) return generation;

            const ancestorGeneration = await this.isAncestor(ancestorId, fullParentNode, generation + 1);
            if (ancestorGeneration) return ancestorGeneration;
        }
    }

    static areSiblings(node1, node2) {
        const normalizeParents = (parents) => {
            if (!Array.isArray(parents)) return [];
            return parents.flat().map(parentId => parentId.toString());
        };

        const node1Parents = normalizeParents(node1.parents);
        const node2Parents = normalizeParents(node2.parents);

        const sharedParents = node1Parents.filter(parentId => node2Parents.includes(parentId));
        
        return sharedParents.length > 0;
    }

    static async findDegreeCousin(node1, node2) {
        const node1Ancestors = await this.getAncestors(node1);
        const node2Ancestors = await this.getAncestors(node2);

        let closestCommonAncestor = null;
        let node1Generation = 0;
        let node2Generation = 0;

        for (let i = 0; i < node1Ancestors.length; i++) {
            for (let j = 0; j < node2Ancestors.length; j++) {
                if (node1Ancestors[i]._id.toString() === node2Ancestors[j]._id.toString()) {
                    closestCommonAncestor = node1Ancestors[i];
                    node1Generation = i;
                    node2Generation = j;
                    break;
                }
            }
            if (closestCommonAncestor) break;
        }

        if (closestCommonAncestor) {
            const cousinDegree = Math.min(node1Generation, node2Generation);
            const removalDegree = Math.abs(node1Generation - node2Generation);
            let relationshipType = `${cousinDegree == 1 ? "" : cousinDegree + " "}cousin`;
            if (removalDegree > 0) {
                relationshipType += ` ${removalDegree} times removed`;
            }
            return { message: 'Cousin found', relationshipType, cousinDegree, removalDegree };
        }

        return false;
    }

    static async getAncestors(node, generation = 0) {
        let ancestors = [];
        for (const parent of node.parents) {
            const fullParentNode = await PersonNodeRepository.getPersonNodeById(parent._id || parent, ['parents', 'person']);
            ancestors.push(fullParentNode);
            const parentAncestors = await this.getAncestors(fullParentNode, generation + 1);
            ancestors = ancestors.concat(parentAncestors);
        }
        return ancestors;
    }

    static async findUncleAuntOrNephewNiece(node1, node2) {
        for (const parent of node1.parents) {
            const parentNode = await PersonNodeRepository.getPersonNodeById(parent._id || parent, ['children', 'parents', 'person']);

            const isSibling = this.areSiblings(parentNode, node2);
            if (isSibling) return { message: 'Uncle/Aunt found', relationshipType: 'uncle/aunt' };

            const isUncleAunt = await this.isDescendant(node2._id, parentNode, 2);
            if (isUncleAunt) return { message: 'Nephew/Niece found', relationshipType: 'nephew/niece' };
        }

        return false;
    }

    static async isDescendant(descendantId, node, generation = 1, path = []) {
        path.push({
            nodeId: node._id.toString(),
            nodeName: node.person.name,
            generation: generation
        });

        if (node._id.toString() === descendantId.toString()) {
            return generation - 1;
        }

        if (node.children.length === 0) {
            return false;
        }

        for (const child of node.children) {
            const fullChildNode = await PersonNodeRepository.getPersonNodeById(child._id || child, ['children', 'person']);

            const descendantGeneration = await this.isDescendant(descendantId, fullChildNode, generation + 1, [...path]);
            if (descendantGeneration) {
                return descendantGeneration;
            }
        }
    }

    static async determineRelationship(referenceNode, destinationNode) {
        try {
            let relationshipType = 'no relationship';

            const ancestorGeneration = await this.isAncestor(destinationNode._id.toString(), referenceNode);
            const descendantGeneration = await this.isDescendant(destinationNode._id.toString(), referenceNode);

            if (ancestorGeneration) {
                if (ancestorGeneration === 1) relationshipType = 'parent';
                else if (ancestorGeneration === 2) relationshipType = 'grandparent';
                else relationshipType = `great-${'great-'.repeat(ancestorGeneration - 3)}grandparent`;
            } else if (descendantGeneration) {
                if (descendantGeneration === 1) relationshipType = 'child';
                else if (descendantGeneration === 2) relationshipType = 'grandchild';
                else relationshipType = `great-${'great-'.repeat(descendantGeneration - 3)}grandchild`;
            } else if (this.areSiblings(referenceNode, destinationNode)) {
                relationshipType = 'sibling';
            } else {
                const uncleAuntNephewNiece = await this.findUncleAuntOrNephewNiece(referenceNode, destinationNode);
                if (uncleAuntNephewNiece) {
                    relationshipType = uncleAuntNephewNiece.relationshipType;
                } else {
                    const cousin = await this.findDegreeCousin(referenceNode, destinationNode);
                    if (cousin) {
                        relationshipType = cousin.relationshipType;
                    }
                }
            }
            return relationshipType;
        } catch (error) {
            console.error('Error in determineRelationship:', error);
            throw error;
        }
    }
}

module.exports = RelationshipService;
