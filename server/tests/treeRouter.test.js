const { test, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app'); 
const api = supertest(app);
const bcrypt = require('bcrypt');

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
    await User.deleteMany({});
    await Person.deleteMany({});
    await PersonNode.deleteMany({});
    await FamilyTree.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root', passwordHash });
    const savedUser = await user.save();
    rootUserId = savedUser._id;

    const rootPerson = new Person({ name: 'Root Person' });
    const savedPerson = await rootPerson.save();

    const rootNode = new PersonNode({ person: savedPerson._id, parents: [], children: [] });
    const savedNode = await rootNode.save();

    parentId = savedNode._id;

    const familyTree = new FamilyTree({ owner: rootUserId, root: savedNode._id });
    await familyTree.save();

    rootNodeId = familyTree._id;

    const childPerson = new Person({ name: 'Child Person' });
    const savedChildPerson = await childPerson.save();

    const childNode = new PersonNode({ person: savedChildPerson._id, parents: [], children: [] });
    const savedChildNode = await childNode.save();

    childNodeId = savedChildNode._id;
  });

  test('adding a child to a specific node succeeds', async () => {
    const res = await api
      .post('/api/trees/add-child')
      .send({ treeId: rootNodeId.toString(), nodeId: parentId.toString(), childId: childNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
  
    assert.strictEqual(res.body.message, 'Child added successfully');

    const parentNode = await PersonNode.findById(parentId);
    assert(parentNode.children.includes(childNodeId.toString()));
  
    const childNode = await PersonNode.findById(childNodeId);
    assert(childNode.parents.includes(parentId.toString()));
  });

  after(async () => {
    await mongoose.connection.close();
  });
});
