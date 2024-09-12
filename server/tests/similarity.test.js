const { test, after, beforeEach, describe } = require('node:test');
const assert = require('assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app'); 
const api = supertest(app);

const { createUser, createPerson, createPersonNode, createFamilyTree } = require('./test_helper');

// MODELS
const Person = require('../models/person');
const PersonNode = require('../models/personNode');
const FamilyTree = require('../models/familyTree');
const User = require('../models/user');

describe('Tree Service Operations', () => {
    let userId;
    let familyTreeId;
    let parentNodeId;
    let otherUserId;
    let otherFamilyTreeId;
    let existingPersonId;
    let existingNodeId;

    beforeEach(async () => {
        // Clear existing data
        await User.deleteMany({});
        await Person.deleteMany({});
        await PersonNode.deleteMany({});
        await FamilyTree.deleteMany({});

        // Create test data
        userId = await createUser('Test User', 'password');
        familyTreeId = await createFamilyTree(userId);
        parentNodeId = await createPersonNode({ name: 'Parent' }, familyTreeId);

        otherUserId = await createUser('Other User', 'password');
        otherFamilyTreeId = await createFamilyTree(otherUserId);
        existingPersonId = await createPerson({ name: 'Child Name', birthdate: '2000-01-01' });
        existingNodeId = await createPersonNode(existingPersonId, otherFamilyTreeId);
    });

    test('treeService.addChild should return a potential match when adding a child node', async () => {
        const childDetails = { name: 'Child Name', birthdate: '2000-01-01' };

        // Call the addChild method
        const res = await api
            .post('/api/trees/add-child')
            .send({ treeId: familyTreeId.toString(), nodeId: parentNodeId.toString(), childDetails })
            .expect(200)
            .expect('Content-Type', /application\/json/);

        // Assertions
        assert.strictEqual(res.body.status, 200);
        assert.strictEqual(res.body.message, 'Child added successfully. Potential match found in another user\'s tree.');
        assert.deepStrictEqual(res.body.potentialMatch, {
            personId: existingPersonId.toString(),
            treeId: otherFamilyTreeId.toString(),
            hasCommonRelatives: false // Adjust based on your logic
        });
    });

    after(async () => {
        await mongoose.connection.close();
    });
});