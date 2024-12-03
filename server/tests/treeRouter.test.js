const { test, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app'); 
const api = supertest(app);
const bcrypt = require('bcrypt');

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
  let newParentId;
  let newGrandparentId;

  beforeEach(async () => {
    // Clear existing data
    await User.deleteMany({});
    await Person.deleteMany({});
    await PersonNode.deleteMany({});
    await FamilyTree.deleteMany({});

    // Create and save root user
    rootUserId = await createUser('root', 'sekret');

    // Create and save root person
    const savedPerson = await createPerson('Root Person');

    // Create and save root person node
    const savedNode = await createPersonNode(savedPerson, [], []);

    parentId = savedNode;

    // Create and save family tree
    const familyTree = await createFamilyTree(rootUserId, savedNode);

    rootNodeId = familyTree;

    // Create and save child person
    const savedChildPerson = await createPerson('Child Person');
    const savedChildNode = await createPersonNode(savedChildPerson, [], []);

    childNodeId = savedChildNode;

    // Create and save a new parent person
    const savedNewParentPerson = await createPerson('New Parent Person');
    const savedNewParentNode = await createPersonNode(savedNewParentPerson, [], []);

    newParentId = savedNewParentNode;

    // Create and save a new grandparent person
    const savedNewGrandparentPerson = await createPerson('New Grandparent Person');
    const savedNewGrandparentNode = await createPersonNode(savedNewGrandparentPerson, [], []);

    newGrandparentId = savedNewGrandparentNode;
  });

  test('adding an existing child to a specific node fails', async () => {
    // First, add the child to the parent
    await api
      .post('/api/trees/add-child')
      .send({ treeId: rootNodeId.toString(), nodeId: parentId.toString(), childId: childNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Now, attempt to add the same child again to the same parent node
    const res = await api
      .post('/api/trees/add-child')
      .send({ treeId: rootNodeId.toString(), nodeId: parentId.toString(), childId: childNodeId.toString() })
      .expect(400)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(res.body.message, 'Child is already linked to the parent');

    const parentNode = await PersonNode.findById(parentId);
    assert(parentNode.children.includes(childNodeId.toString()));
  
    const childNode = await PersonNode.findById(childNodeId);
    assert(childNode.parents.includes(parentId.toString()));
  });
  
  test('adding an existing parent to a specific node fails', async () => {
    // First, add the new parent to the child
    await api
      .post('/api/trees/add-parent')
      .send({ treeId: rootNodeId.toString(), nodeId: parentId.toString(), parentId: newParentId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Now, attempt to add the same parent again to the same child node
    const res = await api
      .post('/api/trees/add-parent')
      .send({ treeId: rootNodeId.toString(), nodeId: parentId.toString(), parentId: newParentId.toString() })
      .expect(400)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(res.body.message, 'Parent is already linked to the child');

    const childNode = await PersonNode.findById(parentId);
    assert(childNode.parents.includes(newParentId.toString()));
  
    const newParentNode = await PersonNode.findById(newParentId);
    assert(newParentNode.children.includes(parentId.toString()));
  });

  after(async () => {
    await mongoose.connection.close();
  });
});
