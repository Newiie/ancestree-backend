const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Mock PersonNodeRepository
const PersonNodeRepository = {
    getPersonNodeById: async (nodeId, populateFields) => {
        // Create mock nodes with different relationship structures
        const mockNodes = {
            'grandparent': {
                _id: new mongoose.Types.ObjectId('grandparent'),
                parents: [],
                children: ['parent'],
                person: { name: 'Grandparent' }
            },
            'parent': {
                _id: new mongoose.Types.ObjectId('parent'),
                parents: ['grandparent'],
                children: ['child'],
                person: { name: 'Parent' }
            },
            'child': {
                _id: new mongoose.Types.ObjectId('child'),
                parents: ['parent'],
                children: ['grandchild'],
                person: { name: 'Child' }
            },
            'grandchild': {
                _id: new mongoose.Types.ObjectId('grandchild'),
                parents: ['child'],
                children: [],
                person: { name: 'Grandchild' }
            },
            'sibling1': {
                _id: new mongoose.Types.ObjectId('sibling1'),
                parents: ['parent1'],
                children: [],
                person: { name: 'Sibling1' }
            },
            'sibling2': {
                _id: new mongoose.Types.ObjectId('sibling2'),
                parents: ['parent1'],
                children: [],
                person: { name: 'Sibling2' }
            },
            'parent1': {
                _id: new mongoose.Types.ObjectId('parent1'),
                parents: [],
                children: ['sibling1', 'sibling2'],
                person: { name: 'Parent1' }
            },
            'uncle': {
                _id: new mongoose.Types.ObjectId('uncle'),
                parents: ['grandparent2'],
                children: [],
                person: { name: 'Uncle' }
            },
            'grandparent2': {
                _id: new mongoose.Types.ObjectId('grandparent2'),
                parents: [],
                children: ['uncle', 'parent2'],
                person: { name: 'Grandparent2' }
            },
            'parent2': {
                _id: new mongoose.Types.ObjectId('parent2'),
                parents: ['grandparent2'],
                children: ['cousin'],
                person: { name: 'Parent2' }
            },
            'cousin': {
                _id: new mongoose.Types.ObjectId('cousin'),
                parents: ['parent2'],
                children: [],
                person: { name: 'Cousin' }
            }
        };

        // Return the mock node, simulating population
        const node = mockNodes[nodeId.toString()];
        if (!node) throw new Error('Node not found');

        // Simulate population of related nodes
        if (populateFields.includes('parents')) {
            node.parents = node.parents.map(parentId => mockNodes[parentId]);
        }
        if (populateFields.includes('children')) {
            node.children = node.children.map(childId => mockNodes[childId]);
        }

        return node;
    }
};

// Create a proxy to inject mock dependencies
const createRelationshipService = (
    personNodeRepo = PersonNodeRepository
) => {
    const RelationshipService = require('../../services/RelationshipService');
    
    // Override repository dependency
    RelationshipService.PersonNodeRepository = personNodeRepo;
    
    return RelationshipService;
};

describe('RelationshipService', () => {
    test('isAncestor - direct parent', async () => {
        const RelationshipService = createRelationshipService();
        
        const child = await PersonNodeRepository.getPersonNodeById('child');
        const parent = await PersonNodeRepository.getPersonNodeById('parent');
        
        const isAncestor = await RelationshipService.isAncestor(parent._id.toString(), child);
        assert.strictEqual(isAncestor, 1);
    });

    test('isAncestor - grandparent', async () => {
        const RelationshipService = createRelationshipService();
        
        const grandchild = await PersonNodeRepository.getPersonNodeById('grandchild');
        const grandparent = await PersonNodeRepository.getPersonNodeById('grandparent');
        
        const isAncestor = await RelationshipService.isAncestor(grandparent._id.toString(), grandchild);
        assert.strictEqual(isAncestor, 2);
    });

    test('areSiblings - true case', async () => {
        const RelationshipService = createRelationshipService();
        
        const sibling1 = await PersonNodeRepository.getPersonNodeById('sibling1');
        const sibling2 = await PersonNodeRepository.getPersonNodeById('sibling2');
        
        const areSiblings = RelationshipService.areSiblings(sibling1, sibling2);
        assert.strictEqual(areSiblings, true);
    });

    test('areSiblings - false case', async () => {
        const RelationshipService = createRelationshipService();
        
        const child = await PersonNodeRepository.getPersonNodeById('child');
        const sibling1 = await PersonNodeRepository.getPersonNodeById('sibling1');
        
        const areSiblings = RelationshipService.areSiblings(child, sibling1);
        assert.strictEqual(areSiblings, false);
    });

    test('getAncestors', async () => {
        const RelationshipService = createRelationshipService();
        
        const grandchild = await PersonNodeRepository.getPersonNodeById('grandchild');
        
        const ancestors = await RelationshipService.getAncestors(grandchild);
        assert.strictEqual(ancestors.length, 3); // child, parent, grandparent
    });

    test('isDescendant - direct child', async () => {
        const RelationshipService = createRelationshipService();
        
        const parent = await PersonNodeRepository.getPersonNodeById('parent');
        const child = await PersonNodeRepository.getPersonNodeById('child');
        
        const isDescendant = await RelationshipService.isDescendant(child._id, parent);
        assert.strictEqual(isDescendant, 1);
    });

    test('isDescendant - grandchild', async () => {
        const RelationshipService = createRelationshipService();
        
        const grandparent = await PersonNodeRepository.getPersonNodeById('grandparent');
        const grandchild = await PersonNodeRepository.getPersonNodeById('grandchild');
        
        const isDescendant = await RelationshipService.isDescendant(grandchild._id, grandparent);
        assert.strictEqual(isDescendant, 2);
    });

    test('determineRelationship - parent', async () => {
        const RelationshipService = createRelationshipService();
        
        const child = await PersonNodeRepository.getPersonNodeById('child');
        const parent = await PersonNodeRepository.getPersonNodeById('parent');
        
        const relationship = await RelationshipService.determineRelationship(child, parent);
        assert.strictEqual(relationship, 'parent');
    });

    test('determineRelationship - grandparent', async () => {
        const RelationshipService = createRelationshipService();
        
        const grandchild = await PersonNodeRepository.getPersonNodeById('grandchild');
        const grandparent = await PersonNodeRepository.getPersonNodeById('grandparent');
        
        const relationship = await RelationshipService.determineRelationship(grandchild, grandparent);
        assert.strictEqual(relationship, 'grandparent');
    });

    test('determineRelationship - sibling', async () => {
        const RelationshipService = createRelationshipService();
        
        const sibling1 = await PersonNodeRepository.getPersonNodeById('sibling1');
        const sibling2 = await PersonNodeRepository.getPersonNodeById('sibling2');
        
        const relationship = await RelationshipService.determineRelationship(sibling1, sibling2);
        assert.strictEqual(relationship, 'sibling');
    });

    test('determineRelationship - cousin', async () => {
        const RelationshipService = createRelationshipService();
        
        const cousin = await PersonNodeRepository.getPersonNodeById('cousin');
        const child = await PersonNodeRepository.getPersonNodeById('child');
        
        const relationship = await RelationshipService.determineRelationship(cousin, child);
        assert.ok(relationship.includes('cousin'));
    });
});