const { test, after, beforeEach, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app'); 
const api = supertest(app);

const treeRepository = require('../repositories/treeRepository')

const { createUser, createPerson, createPersonNode, createFamilyTree, findAllPersonNodes } = require('./test_helper');

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

    // Create and save parent person node
    const savedParentPerson = await createPerson('Parent Person');
    const savedParentNode = await createPersonNode(savedParentPerson, [grandparentId], []);
    parentId = savedParentNode;

    // Create and save child person node
    const savedChildPerson = await createPerson('Child Person');
    const savedChildNode = await createPersonNode(savedChildPerson, [parentId], []);
    childNodeId = savedChildNode;

    // Update parent to include child
    const parentNode = await PersonNode.findById(parentId);
    parentNode.children.push(childNodeId);
    await parentNode.save();

    // Create and save uncle/aunt person node
    const savedUncleAuntPerson = await createPerson('Uncle Aunt Person');
    const savedUncleAuntNode = await createPersonNode(savedUncleAuntPerson, [grandparentId], []);
    uncleAuntId = savedUncleAuntNode;

    // Update grandparent to include parent
    const grandparentNode = await PersonNode.findById(grandparentId);
    grandparentNode.children.push(parentId);
    grandparentNode.children.push(uncleAuntId);
    await grandparentNode.save();

    

    // Create and save cousin person node
    const savedCousinPerson = await createPerson('Cousin Person');
    const savedCousinNode = await createPersonNode(savedCousinPerson, [uncleAuntId], []);
    cousinNodeId = savedCousinNode;

    // Update uncle/aunt to include cousin
    const uncleAuntNode = await PersonNode.findById(uncleAuntId);
    uncleAuntNode.children.push(cousinNodeId);
    await uncleAuntNode.save();
  });

  test('checking the parent-child relationship', async () => {
    // Check parent-child relationship
    let res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: grandparentId.toString(), destinationId: childNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    assert.deepStrictEqual(res.body,  { status: 200, message: 'Relationship determined successfully', relationshipType: 'grandchild' });
  
    // Check child-parent relationship (reverse of the above check)
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: grandparentId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
  

    assert.deepStrictEqual(res.body,  { status: 200, message: 'Relationship determined successfully', relationshipType: 'grandparent' });
  });
  

  test('checking the sibling relationship', async () => {
    // Create a sibling node
    const siblingPerson = await createPerson('Sibling Person');
    const siblingNode = await createPersonNode(siblingPerson, [parentId], []);
    
    // Check sibling relationship
    const res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: uncleAuntId.toString(), destinationId: parentId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
  
    assert.deepStrictEqual(res.body, { status: 200, message: 'Relationship determined successfully', relationshipType: 'sibling' });
  });

  test('checking the grandparent-grandchild relationship', async () => {
    // Check grandparent-grandchild relationship
    const res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: grandparentId.toString(), destinationId: childNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
  
    assert.strictEqual(res.body.relationshipType, 'grandchild');
  });

  test('checking the great-grandparent and great-grandchild relationship', async () => {

      // Create and save great-grandparent person node
      const savedGreatGrandparentPerson = await createPerson('Great Grandparent Person');
      const savedGreatGrandparentNode = await createPersonNode(savedGreatGrandparentPerson, [], []);
      const greatGrandparentId = savedGreatGrandparentNode;
    
      // Update great-grandparent to include grandparent as a child
      const greatGrandparentNode = await PersonNode.findById(greatGrandparentId);
      greatGrandparentNode.children.push(grandparentId);
      await greatGrandparentNode.save();
    
      // Update grandparent to include great-grandparent as a parent
      const grandparentNode = await PersonNode.findById(grandparentId);
      grandparentNode.parents.push(greatGrandparentId);
      await grandparentNode.save();
      
      // Check great-grandparent-great-grandchild relationship (from great-grandparent to child)
      let res = await api
        .post('/api/trees/check-relationship')
        .send({ referenceId: greatGrandparentId.toString(), destinationId: childNodeId.toString() })
        .expect(200)
        .expect('Content-Type', /application\/json/);
      
      assert.strictEqual(res.body.relationshipType, 'great-grandchild');
    
      // Check great-grandchild-great-grandparent relationship (from child to great-grandparent)
      res = await api
        .post('/api/trees/check-relationship')
        .send({ referenceId: childNodeId.toString(), destinationId: greatGrandparentId.toString() })
        .expect(200)
        .expect('Content-Type', /application\/json/);
      
      assert.strictEqual(res.body.relationshipType, 'great-grandparent');
  });
  

  test('checking the great-great-grandparent and great-great-grandchild relationship', async () => {
    // Create and save great-grandparent person node
    const savedGreatGrandparentPerson = await createPerson('Great Grandparent Person');
    const savedGreatGrandparentNode = await createPersonNode(savedGreatGrandparentPerson, [], []);
    const greatGrandparentId = savedGreatGrandparentNode;
  
    // Update great-grandparent to include grandparent
    const greatGrandparentNode = await PersonNode.findById(greatGrandparentId);
    greatGrandparentNode.children.push(grandparentId);
    await greatGrandparentNode.save();
    
    // Update grandparent to include great-grandparent as a parent
    const grandparentNode = await PersonNode.findById(grandparentId);
    grandparentNode.parents.push(greatGrandparentId);
    await grandparentNode.save();

    // Create and save great-great-grandparent person node
    const savedGreatGreatGrandparentPerson = await createPerson('Great Great Grandparent Person');
    const savedGreatGreatGrandparentNode = await createPersonNode(savedGreatGreatGrandparentPerson, [], []);
    const greatGreatGrandparentId = savedGreatGreatGrandparentNode;
  
    // Update great-great-grandparent to include great-grandparent
    const greatGreatGrandparentNode = await PersonNode.findById(greatGreatGrandparentId);
    greatGreatGrandparentNode.children.push(greatGrandparentId);
    await greatGreatGrandparentNode.save();
    
    let gGrandParent = await PersonNode.findById(greatGrandparentId);
    gGrandParent.parents.push(savedGreatGreatGrandparentNode);
    await gGrandParent.save();

    // Create and save great-grandchild person node
    const savedGreatGrandchildPerson = await createPerson('Great Grandchild Person');
    const savedGreatGrandchildNode = await createPersonNode(savedGreatGrandchildPerson, [childNodeId], []);
    const greatGrandchildId = savedGreatGrandchildNode;
  
    // Update child to include great-grandchild
    const childNode = await PersonNode.findById(childNodeId);
    childNode.children.push(greatGrandchildId);
    await childNode.save();
  
    // Create and save great-great-grandchild person node
    const savedGreatGreatGrandchildPerson = await createPerson('Great Great Grandchild Person');
    const savedGreatGreatGrandchildNode = await createPersonNode(savedGreatGreatGrandchildPerson, [greatGrandchildId], []);
    const greatGreatGrandchildId = savedGreatGreatGrandchildNode;
  
    // Update great-grandchild to include great-great-grandchild
    const greatGrandchildNode = await PersonNode.findById(greatGrandchildId);
    greatGrandchildNode.children.push(greatGreatGrandchildId);
    await greatGrandchildNode.save();
  
    // Check great-great-grandparent-great-great-grandchild relationship
    let res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: greatGreatGrandparentId.toString(), destinationId: greatGreatGrandchildId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    assert.strictEqual(res.body.relationshipType, 'great-great-great-great-grandchild');
    
    // console.log("FIND PERSON NODE", await findAllPersonNodes())
    // Check great-great-grandchild-great-great-grandparent relationship (reverse of the above check)
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: greatGreatGrandchildId.toString(), destinationId: greatGreatGrandparentId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    assert.strictEqual(res.body.relationshipType, 'great-great-great-great-grandparent');
  });
  

  test('checking the uncle/aunt-nephew/niece relationship', async () => {
    // Part 1: Check uncle/aunt-nephew/niece relationship with uncle/aunt as reference
    let res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: uncleAuntId.toString(), destinationId: childNodeId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // console.log(await treeRepository.getPersonNodeById(grandparentId, ['parents', 'person', 'children']));
    // console.log(await treeRepository.getPersonNodeById(parentId, ['parents', 'person']));

    assert.strictEqual(res.body.relationshipType, 'nephew/niece');

    // Part 2: Check nephew/niece-uncle/aunt relationship with nephew/niece as reference
    res = await api
      .post('/api/trees/check-relationship')
      .send({ referenceId: childNodeId.toString(), destinationId: uncleAuntId.toString() })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // console.log(await treeRepository.getPersonNodeById(grandparentId, ['parents', 'person', 'children']));
    // console.log(await treeRepository.getPersonNodeById(parentId, ['parents', 'person']));

    assert.strictEqual(res.body.relationshipType, 'uncle/aunt');
});

  // test('checking the cousin relationship', async () => {
  //   // Check cousin relationship
  //   const res = await api
  //     .post('/api/trees/check-relationship')
  //     .send({ referenceId: cousinNodeId.toString(), destinationId: childNodeId.toString() })
  //     .expect(200)
  //     .expect('Content-Type', /application\/json/);
  
  //   assert.strictEqual(res.body.relationshipType, 'cousin');
  // });



  after(async () => {
    await mongoose.connection.close();
  });
});
