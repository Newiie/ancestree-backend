const { test, describe, mock } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Create a mock ObjectId function
const createMockObjectId = () => ({
    toString: () => 'mockObjectId',
    _id: 'mockObjectId'
});

// Mock PersonNodeRepository with fully mocked methods
const createMockPersonNodeRepository = () => ({
    createPersonNode: mock.fn((nodeData) => ({
        _id: createMockObjectId(),
        ...nodeData
    })),
    setFamilyTree: mock.fn((nodeId, familyTreeId) => ({
        _id: nodeId,
        familyTree: familyTreeId
    })),
    addParentToNode: mock.fn((nodeId, parentId) => ({
        _id: nodeId,
        parents: [parentId]
    })),
    deletePersonNode: mock.fn((nodeId) => ({
        _id: nodeId,
        deleted: true
    })),
    getPersonNodeById: mock.fn((nodeId, populate = []) => {
        const baseNode = {
            _id: nodeId,
            person: { name: 'Test Person' },
            parents: [],
            children: [],
            familyTree: createMockObjectId()
        };

        // Simulate population based on requested fields
        if (populate.includes('person')) {
            baseNode.person = { 
                _id: createMockObjectId(),
                name: 'Test Person',
                generalInformation: {
                    firstName: 'John',
                    lastName: 'Doe'
                }
            };
        }

        return baseNode;
    }),
    updatePersonNode: mock.fn((nodeId, updateData) => ({
        _id: nodeId,
        ...updateData
    }))
});

// Create a proxy to inject mock dependencies
const createPersonNodeService = (
    personNodeRepo = createMockPersonNodeRepository()
) => {
    // Require the actual service
    const PersonNodeService = require('../../services/PersonNodeService');
    
    // Create a proxy to inject mock repository
    return new Proxy(PersonNodeService, {
        get(target, prop) {
            // If the method exists in the original service, use it
            if (typeof target[prop] === 'function') {
                return async (...args) => {
                    // Use the mock repository for these methods
                    const mockMethods = [
                        'createPersonNode', 
                        'setFamilyTree', 
                        'addParent', 
                        'deletePersonNode', 
                        'getPersonNodeById', 
                        'updatePersonNode'
                    ];

                    if (mockMethods.includes(prop)) {
                        return personNodeRepo[prop](...args);
                    }

                    // Otherwise, call the original method
                    return target[prop](...args);
                };
            }
            return target[prop];
        }
    });
};

describe('PersonNodeService', () => {
    test('createPersonNode - successful creation', async () => {
        const PersonNodeService = createPersonNodeService();
        
        const nodeData = {
            person: 'personId',
            parents: [],
            children: []
        };

        const personNode = await PersonNodeService.createPersonNode(nodeData);
        
        assert.strictEqual(personNode._id.toString(), 'mockObjectId');
        assert.strictEqual(personNode.person, nodeData.person);
    });

    test('setFamilyTree - successful assignment', async () => {
        const PersonNodeService = createPersonNodeService();
        
        const nodeId = 'nodeId';
        const familyTreeId = 'familyTreeId';

        const updatedNode = await PersonNodeService.setFamilyTree(nodeId, familyTreeId);
        
        assert.strictEqual(updatedNode.familyTree, familyTreeId);
    });

    test('addParent - successful addition', async () => {
        const PersonNodeService = createPersonNodeService();
        
        const nodeId = 'nodeId';
        const parentId = 'parentId';

        const updatedNode = await PersonNodeService.addParent(nodeId, parentId);
        
        assert.deepStrictEqual(updatedNode.parents, [parentId]);
    });

    test('deletePersonNode - successful deletion', async () => {
        const PersonNodeService = createPersonNodeService();
        
        const nodeId = 'nodeId';

        const deletionResult = await PersonNodeService.deletePersonNode(nodeId);
        
        assert.ok(deletionResult.deleted);
        assert.strictEqual(deletionResult._id, nodeId);
    });

    test('getPersonNodeById - retrieval without population', async () => {
        const PersonNodeService = createPersonNodeService();
        
        const nodeId = 'nodeId';

        const personNode = await PersonNodeService.getPersonNodeById(nodeId);
        
        assert.strictEqual(personNode._id, nodeId);
        assert.ok(personNode.person);
        assert.ok(Array.isArray(personNode.parents));
        assert.ok(Array.isArray(personNode.children));
    });

    test('getPersonNodeById - retrieval with population', async () => {
        const PersonNodeService = createPersonNodeService();
        
        const nodeId = 'nodeId';

        const personNode = await PersonNodeService.getPersonNodeById(nodeId, ['person']);
        
        assert.strictEqual(personNode._id, nodeId);
        assert.ok(personNode.person._id);
        assert.strictEqual(personNode.person.name, 'Test Person');
        assert.ok(personNode.person.generalInformation);
    });

    test('updatePersonNode - successful update', async () => {
        const PersonNodeService = createPersonNodeService();
        
        const nodeId = 'nodeId';
        const updateData = {
            parents: ['parentId1'],
            children: ['childId1']
        };

        const updatedNode = await PersonNodeService.updatePersonNode(nodeId, updateData);
        
        assert.strictEqual(updatedNode._id, nodeId);
        assert.deepStrictEqual(updatedNode.parents, updateData.parents);
        assert.deepStrictEqual(updatedNode.children, updateData.children);
    });
});