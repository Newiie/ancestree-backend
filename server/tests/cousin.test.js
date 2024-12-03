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
    let grandparentId;
    let uncleAuntId;
    let cousinNodeId;
    let cousin1Id;
    let cousin2Id;
    let cousin3Id;
    let secondCousin1Id;
    let secondCousin2Id;
  
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
  
      // Create and save grandparent person node
      const savedGrandparentPerson = await createPerson('Grandparent Person');
      const savedGrandparentNode = await createPersonNode(savedGrandparentPerson, [], []);
      grandparentId = savedGrandparentNode;
  
      // Create and save multiple uncle/aunt person nodes
      const savedUncleAunt1Person = await createPerson('Uncle 1');
      const savedUncleAunt1Node = await createPersonNode(savedUncleAunt1Person, [grandparentId], []);
      const uncle1Id = savedUncleAunt1Node;
  
      const savedUncleAunt2Person = await createPerson('Uncle 2');
      const savedUncleAunt2Node = await createPersonNode(savedUncleAunt2Person, [grandparentId], []);
      const uncle2Id = savedUncleAunt2Node;
  
      const savedUncleAunt3Person = await createPerson('Uncle 3');
      const savedUncleAunt3Node = await createPersonNode(savedUncleAunt3Person, [grandparentId], []);
      const uncle3Id = savedUncleAunt3Node;
  
      // Update grandparent to include the uncles as children
      const grandparentNode = await PersonNode.findById(grandparentId);
      grandparentNode.children.push(uncle1Id);
      grandparentNode.children.push(uncle2Id);
      grandparentNode.children.push(uncle3Id);
      await grandparentNode.save();
  
      // Create and save children for each uncle (cousins)
      const savedCousin1Person = await createPerson('Cousin 1 (Uncle 1\'s Child)');
      const savedCousin1Node = await createPersonNode(savedCousin1Person, [uncle1Id], []);
        cousin1Id = savedCousin1Node;
  
      const savedCousin2Person = await createPerson('Cousin 2 (Uncle 2\'s Child)');
      const savedCousin2Node = await createPersonNode(savedCousin2Person, [uncle2Id], []);
        cousin2Id = savedCousin2Node;
  
      const savedCousin3Person = await createPerson('Cousin 3 (Uncle 3\'s Child)');
      const savedCousin3Node = await createPersonNode(savedCousin3Person, [uncle3Id], []);
        cousin3Id = savedCousin3Node;

      // Create and save second cousins (children of cousins)
      const savedSecondCousin1Person = await createPerson('Second Cousin 1 (Cousin 1\'s Child)');
      const savedSecondCousin1Node = await createPersonNode(savedSecondCousin1Person, [cousin1Id], []);
        secondCousin1Id = savedSecondCousin1Node;

      const savedSecondCousin2Person = await createPerson('Second Cousin 2 (Cousin 2\'s Child)');
      const savedSecondCousin2Node = await createPersonNode(savedSecondCousin2Person, [cousin2Id], []);
        secondCousin2Id = savedSecondCousin2Node;
  
      // Update uncles to include their children
      const uncle1Node = await PersonNode.findById(uncle1Id);
      uncle1Node.children.push(cousin1Id);
      await uncle1Node.save();
  
      const uncle2Node = await PersonNode.findById(uncle2Id);
      uncle2Node.children.push(cousin2Id);
      await uncle2Node.save();
  
      const uncle3Node = await PersonNode.findById(uncle3Id);
      uncle3Node.children.push(cousin3Id);
      await uncle3Node.save();
    });
  
    test('checking the complex cousin relationship', async () => {
      // Check cousin relationship between Cousin 1 (Uncle 1's Child) and Cousin 2 (Uncle 2's Child)
      let res = await api
        .post('/api/trees/check-relationship')
        .send({ referenceId: cousin1Id.toString(), destinationId: cousin2Id.toString() })
        .expect(200)
        .expect('Content-Type', /application\/json/);
      assert.strictEqual(res.body.relationshipType, 'cousin');
  
      // Check cousin relationship between Cousin 2 (Uncle 2's Child) and Cousin 3 (Uncle 3's Child)
      res = await api
        .post('/api/trees/check-relationship')
        .send({ referenceId: cousin2Id.toString(), destinationId: cousin3Id.toString() })
        .expect(200)
        .expect('Content-Type', /application\/json/);
      assert.strictEqual(res.body.relationshipType, 'cousin');
  
      // Check cousin relationship between Cousin 1 (Uncle 1's Child) and Cousin 3 (Uncle 3's Child)
      res = await api
        .post('/api/trees/check-relationship')
        .send({ referenceId: cousin1Id.toString(), destinationId: cousin3Id.toString() })
        .expect(200)
        .expect('Content-Type', /application\/json/);
      assert.strictEqual(res.body.relationshipType, 'cousin');
    });

    test('checking the degree cousin relationship', async () => {
      // Check first cousin relationship
      let res = await api
        .post('/api/trees/check-relationship')
        .send({ referenceId: cousin1Id.toString(), destinationId: cousin2Id.toString() })
        .expect(200)
        .expect('Content-Type', /application\/json/);
      assert.strictEqual(res.body.relationshipType, 'cousin');

      // Check second cousin relationship between second cousins (children of first cousins)
      res = await api
        .post('/api/trees/check-relationship')
        .send({ referenceId: secondCousin1Id.toString(), destinationId: secondCousin2Id.toString() })
        .expect(200)
        .expect('Content-Type', /application\/json/);
      assert.strictEqual(res.body.relationshipType, '2 cousin');
    });
  
    after(async () => {
      await mongoose.connection.close();
    });
  });
