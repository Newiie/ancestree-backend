const { test, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert');
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

describe('Tree operations', () => {
  let rootUserId;
  let rootNodeId;
  let parentId;
  let childNodeId;

  beforeEach(async () => {
    // Clear existing data
    await User.deleteMany({});
    await Person.deleteMany({});
    await PersonNode.deleteMany({});
    await FamilyTree.deleteMany({});

    // Create and save root user
    rootUserId = await createUser('root', 'sekret');

    // Create and save root person node
    const savedPerson = await createPerson('Root Person');
    const savedNode = await createPersonNode(savedPerson, [], []);
    rootNodeId = savedNode;

    // Create and save family tree
    await createFamilyTree(rootUserId, savedNode);

    // Create and save parent person node
    const savedParentPerson = await createPerson('Parent Person');
    const savedParentNode = await createPersonNode(savedParentPerson, [], []);
    parentId = savedParentNode;

    // Create and save child person node
    const savedChildPerson = await createPerson('Child Person');
    const savedChildNode = await createPersonNode(savedChildPerson, [parentId], []);
    childNodeId = savedChildNode;

    // Update parent to include child
    const parentNode = await PersonNode.findById(parentId);
    parentNode.children.push(childNodeId);
    await parentNode.save();
  });

  test('checking the parent-child relationship', async () => {
    // Check parent-child relationship
    let res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: parentId.toString(), destinationId: childNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    console.log("PC relationship type:", res.body.relationshipType); // Should print the relationship type
    
    assert.strictEqual(res.body.relationshipType, 'child');
  
    // Check child-parent relationship (reverse of the above check)
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: parentId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
  
    console.log("CP relationship type:", res.body.relationshipType); // Should print the relationship type
    
    assert.strictEqual(res.body.relationshipType, 'parent');
  });
  

  test('checking the sibling relationship', async () => {
    // Create a sibling node
    const siblingPerson = await createPerson('Sibling Person');
    const siblingNode = await createPersonNode(siblingPerson, [parentId], []);
    
    // Check sibling relationship
    const res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: siblingNode.toString(), destinationId: childNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
  
    assert.strictEqual(res.body.relationshipType, 'sibling');
  });

  
  after(async () => {
    await mongoose.connection.close();
  });
});
