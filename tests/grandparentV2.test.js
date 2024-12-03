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

describe('Child with both parents and grandparents', () => {
  let childNodeId;
  let motherNodeId;
  let fatherNodeId;
  let maternalGrandmotherId;
  let maternalGrandfatherId;
  let paternalGrandmotherId;
  let paternalGrandfatherId;

  beforeEach(async () => {
    // Clear existing data
    await User.deleteMany({});
    await Person.deleteMany({});
    await PersonNode.deleteMany({});
    await FamilyTree.deleteMany({});

    // Create and save root user
    const rootUserId = await createUser('root', 'sekret');

    // Create and save child person node
    const savedChildPerson = await createPerson('Child Person');
    const savedChildNode = await createPersonNode(savedChildPerson, [], []);
    childNodeId = savedChildNode;

    // Create and save family tree with the child as root
    await createFamilyTree(rootUserId, savedChildNode);

    // Create and save mother person node
    const savedMotherPerson = await createPerson('Mother Person');
    const savedMotherNode = await createPersonNode(savedMotherPerson, [], [childNodeId]);
    motherNodeId = savedMotherNode;

    // Create and save father person node
    const savedFatherPerson = await createPerson('Father Person');
    const savedFatherNode = await createPersonNode(savedFatherPerson, [], [childNodeId]);
    fatherNodeId = savedFatherNode;

    // Update child to include parents
    const childNode = await PersonNode.findById(childNodeId);
    childNode.parents.push(motherNodeId, fatherNodeId);
    await childNode.save();

    // Create and save maternal grandparents
    const savedMaternalGrandmother = await createPerson('Maternal Grandmother');
    const savedMaternalGrandmotherNode = await createPersonNode(savedMaternalGrandmother, [], [motherNodeId]);
    maternalGrandmotherId = savedMaternalGrandmotherNode;

    const savedMaternalGrandfather = await createPerson('Maternal Grandfather');
    const savedMaternalGrandfatherNode = await createPersonNode(savedMaternalGrandfather, [], [motherNodeId]);
    maternalGrandfatherId = savedMaternalGrandfatherNode;

    // Update mother to include her parents (maternal grandparents)
    const motherNode = await PersonNode.findById(motherNodeId);
    motherNode.parents.push(maternalGrandmotherId, maternalGrandfatherId);
    await motherNode.save();

    // Create and save paternal grandparents
    const savedPaternalGrandmother = await createPerson('Paternal Grandmother');
    const savedPaternalGrandmotherNode = await createPersonNode(savedPaternalGrandmother, [], [fatherNodeId]);
    paternalGrandmotherId = savedPaternalGrandmotherNode;

    const savedPaternalGrandfather = await createPerson('Paternal Grandfather');
    const savedPaternalGrandfatherNode = await createPersonNode(savedPaternalGrandfather, [], [fatherNodeId]);
    paternalGrandfatherId = savedPaternalGrandfatherNode;

    // Update father to include his parents (paternal grandparents)
    const fatherNode = await PersonNode.findById(fatherNodeId);
    fatherNode.parents.push(paternalGrandmotherId, paternalGrandfatherId);
    await fatherNode.save();
  });

  test('checking ancestor relationships', async () => {
    // Check parent-child relationship (mother)
    let res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: motherNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    
    assert.strictEqual(res.body.relationshipType, 'parent');

    // Check parent-child relationship (father)
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: fatherNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    assert.strictEqual(res.body.relationshipType, 'parent');

    // Check grandparent-grandchild relationship (maternal grandmother)
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: maternalGrandmotherId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    assert.strictEqual(res.body.relationshipType, 'grandparent');

    // Check grandparent-grandchild relationship (maternal grandfather)
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: maternalGrandfatherId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    assert.strictEqual(res.body.relationshipType, 'grandparent');

    // Check grandparent-grandchild relationship (paternal grandmother)
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: paternalGrandmotherId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    assert.strictEqual(res.body.relationshipType, 'grandparent');

    // Check grandparent-grandchild relationship (paternal grandfather)
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: paternalGrandfatherId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    assert.strictEqual(res.body.relationshipType, 'grandparent');
  });

  after(async () => {
    await mongoose.connection.close();
  });
});
