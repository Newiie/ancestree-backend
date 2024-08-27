const bcrypt = require('bcrypt');

const Person = require('../models/person');
const PersonNode = require('../models/personNode');
const FamilyTree = require('../models/familyTree');
const User = require('../models/user');

async function createUser(username, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash });
    const savedUser = await user.save();
    return savedUser._id;
}

async function createPerson(name) {
    const person = new Person({ name });
    const savedPerson = await person.save();
    return savedPerson._id;
}

async function createPersonNode(personId, parents = [], children = []) {
    const node = new PersonNode({ person: personId, parents, children });
    const savedNode = await node.save();
    return savedNode._id;
}

async function createFamilyTree(ownerId, rootId) {
    const familyTree = new FamilyTree({ owner: ownerId, root: rootId });
    const savedFamilyTree = await familyTree.save();
    return savedFamilyTree._id;
}

async function findAllPersonNodes() {
  try {
    const personNodes = await PersonNode.find({})
      .populate('person') // Populate the person field
      .populate({
        path: 'parents',
        populate: {
          path: 'person', // Populate the person field of the parent nodes as well
        },
      })
      .exec();

    console.log('Person Nodes with their Parents and Person details:', personNodes);
    return personNodes;
  } catch (error) {
    console.error('Error finding PersonNodes:', error);
  }
}

module.exports = {
    createUser,
    createPerson,
    createPersonNode,
    createFamilyTree,
    findAllPersonNodes
};
