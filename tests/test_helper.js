const bcrypt = require('bcrypt');

const User = require('../models/User');
const Person = require('../models/Person');
const PersonNode = require('../models/PersonNode');
const FamilyTree = require('../models/FamilyTree');

const createUser = async (username, password) => {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash });
    const savedUser = await user.save();
    return savedUser._id;
};

const createPerson = async (personDetails) => {
    const person = new Person(personDetails);
    const savedPerson = await person.save();
    return savedPerson._id;
};

const createPersonNode = async (personId, familyTreeId) => {
    const personNode = new PersonNode({ person: personId, familyTree: familyTreeId });
    const savedPersonNode = await personNode.save();
    return savedPersonNode._id;
};

const createFamilyTree = async (userId) => {
    const familyTree = new FamilyTree({ user: userId });
    const savedFamilyTree = await familyTree.save();
    return savedFamilyTree._id;
};

module.exports = {
    createUser,
    createPerson,
    createPersonNode,
    createFamilyTree
};
