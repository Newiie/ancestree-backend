const { test, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app'); 
const api = supertest(app);
const { createUser, createPerson, createPersonNode, createFamilyTree } = require('./test_helper');

const Person = require('../models/person');
const PersonNode = require('../models/personNode');
const FamilyTree = require('../models/familyTree');
const User = require('../models/user');

describe('Tree operations', () => {
  let rootUserId;
  let rootNodeId;
  let parentId;
  let childNodeId;
  let childNodeIds = [];
  let additionalParentIds = [];

  beforeEach(async () => {
    await User.deleteMany({});
    await Person.deleteMany({});
    await PersonNode.deleteMany({});
    await FamilyTree.deleteMany({});

    rootUserId = await createUser('root', 'sekret');
    
    const rootPersonId = await createPerson('Root Person');
    rootNodeId = await createPersonNode(rootPersonId, [], []);
    
    rootNodeId = await createFamilyTree(rootUserId, rootNodeId);

    // Create initial child nodes
    for (let i = 0; i < 3; i++) {
        const childPersonId = await createPerson(`Child Person ${i}`);
        const childNodeId = await createPersonNode(childPersonId, [], []);
        childNodeIds.push(childNodeId);
    }

    // Create additional parent nodes
    for (let i = 0; i < 3; i++) {
        const parentPersonId = await createPerson(`Additional Parent Person ${i}`);
        const parentNodeId = await createPersonNode(parentPersonId, [], []);
        additionalParentIds.push(parentNodeId);
    }

    // Use the first child node and the first additional parent node for testing
    parentId = additionalParentIds[0];
    childNodeId = childNodeIds[0];
  });

  test('adding multiple parents to a specific node succeeds and limits to two parents', async () => {
    // Add the first two parents
    for (let i = 0; i < 2; i++) {
        const res = await api
            .post('/api/trees/add-parent')
            .send({ treeId: rootNodeId.toString(), nodeId: childNodeIds[0].toString(), parentId: additionalParentIds[i].toString() })
            .expect(200)
            .expect('Content-Type', /application\/json/);

        assert.strictEqual(res.body.message, 'Parent added successfully');
    }

    // Attempt to add a third parent, which should fail
    const res = await api
        .post('/api/trees/add-parent')
        .send({ treeId: rootNodeId.toString(), nodeId: childNodeIds[0].toString(), parentId: additionalParentIds[2].toString() })
        .expect(400)
        .expect('Content-Type', /application\/json/);

    assert.strictEqual(res.body.message, 'Cannot add more than two parents');

    // Verify that only two parents were added
    const childNode = await PersonNode.findById(childNodeIds[0]).populate('parents');

    // Print the structure of the child node
    console.log("Child Node Data:");
    console.log(`Node ID: ${childNode._id}`);
    console.log(`Parents (${childNode.parents.length}):`);
    childNode.parents.forEach(parent => {
        console.log(`  Parent ID: ${parent._id}`);
        console.log(`    Name: ${parent.name}`);
        // Add more details if necessary
    });

    assert.strictEqual(childNode.parents.length, 2);

    for (let i = 0; i < 2; i++) {
        assert(childNode.parents.some(parent => parent._id.toString() === additionalParentIds[i].toString()));
    }
});

  
  after(async () => {
    await mongoose.connection.close();
  });
});
