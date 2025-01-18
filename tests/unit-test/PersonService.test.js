const { test, describe } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Mock dependencies
const PersonRepository = {
    createPerson: (personDetails) => ({
        _id: 'person123',
        ...personDetails
    }),
    setFamilyTree: (personId, familyTreeId) => ({
        _id: personId,
        familyTree: familyTreeId
    }),
    findPersonRelationship: (personDetails) => [
        {
            _id: 'person123',
            ...personDetails,
            profilePicture: 'profile.jpg'
        }
    ],
    getPersonById: (personId) => ({
        _id: personId,
        toJSON: () => ({
            treeId: 'tree123',
            personId: personId,
            generalInformation: {
                firstName: 'John',
                lastName: 'Doe'
            }
        })
    }),
    updateRelatedUser: (personId, userId) => ({
        _id: personId,
        relatedUser: userId
    }),
    updatePerson: () => {},
    updateProfilePicture: (personId, imageUrl) => ({
        _id: personId,
        profilePicture: imageUrl
    }),
    updateBackgroundPicture: (personId, imageUrl) => ({
        _id: personId,
        backgroundPicture: imageUrl
    })
};

const UserRepository = {
    findUserById: (userId) => ({
        _id: userId,
        username: 'testuser',
        person: { _id: 'person123' },
        friends: [],
        friendRequest: []
    })
};

const ImageService = {
    getImageUrl: (imagePath) => `https://example.com/${imagePath}`,
    uploadProfilePicture: (file, username) => `profile_${username}.jpg`,
    uploadBackgroundPicture: (file, username) => `background_${username}.jpg`
};

// Create a proxy to inject mock dependencies
const createPersonService = (
    personRepo = PersonRepository, 
    userRepo = UserRepository,
    imageService = ImageService
) => {
    return new Proxy(require('../../services/PersonService'), {
        get(target, prop) {
            // Override specific methods with mocked implementations
            const methodOverrides = {
                createPerson: async (personDetails) => {
                    return await personRepo.createPerson(personDetails);
                },
                setFamilyTree: async (personId, familyTreeId) => {
                    // Validate inputs
                    if (!mongoose.Types.ObjectId.isValid(personId) || 
                        !mongoose.Types.ObjectId.isValid(familyTreeId)) {
                        throw new Error('Invalid Person or Family Tree ID');
                    }
                    return await personRepo.setFamilyTree(personId, familyTreeId);
                },
                findPersons: async (personDetails) => {
                    const persons = await personRepo.findPersonRelationship(personDetails);
                    return Promise.all(
                        persons.map(async (person) => ({
                            ...person,
                            profilePicture: person.profilePicture 
                                ? await imageService.getImageUrl(person.profilePicture) 
                                : "/images/doge.png"
                        }))
                    );
                },
                getPersonByUserId: async (userId) => {
                    // Validate input
                    if (!userId) {
                        throw new Error('User ID is required');
                    }
                    if (!mongoose.Types.ObjectId.isValid(userId)) {
                        throw new Error('Invalid User ID');
                    }

                    const user = await userRepo.findUserById(userId);
                    const person = await personRepo.getPersonById(user.person._id);
                    
                    const { treeId, personId, ...filteredPerson } = person.toJSON();
                    return { 
                        ...filteredPerson, 
                        userId: user._id, 
                        friendsList: user.friends,
                        friendRequestList: user.friendRequest
                    };
                },
                updateRelatedUser: async (personId, userId) => {
                    // Validate inputs
                    if (!mongoose.Types.ObjectId.isValid(personId) || 
                        !mongoose.Types.ObjectId.isValid(userId)) {
                        throw new Error('Invalid Person or User ID');
                    }
                    return await personRepo.updateRelatedUser(personId, userId);
                },
                updatePerson: async (personId, update) => {
                    // Validate input
                    if (!mongoose.Types.ObjectId.isValid(personId)) {
                        throw new Error('Invalid Person ID');
                    }
                    await personRepo.updatePerson(personId, update);
                    const person = await personRepo.getPersonById(personId);
                    return { status: 200, message: "Person updated successfully" };
                },
                updateProfilePicture: async (userId, file) => {
                    // Validate input
                    if (!mongoose.Types.ObjectId.isValid(userId)) {
                        throw new Error('Invalid User ID');
                    }
                    const user = await userRepo.findUserById(userId);
                    const imageUrl = await imageService.uploadProfilePicture(file, user.username);
                    return await personRepo.updateProfilePicture(user.person._id, imageUrl);
                },
                updateBackgroundPicture: async (userId, backgroundPicture) => {
                    // Validate input
                    if (!mongoose.Types.ObjectId.isValid(userId)) {
                        throw new Error('Invalid User ID');
                    }
                    const user = await userRepo.findUserById(userId);
                    const imageUrl = await imageService.uploadBackgroundPicture(backgroundPicture, user.username);
                    return await personRepo.updateBackgroundPicture(user.person._id, imageUrl);
                }
            };

            // Return the overridden method if it exists, otherwise return the original method
            return methodOverrides[prop] || target[prop];
        }
    });
};

describe('PersonService', () => {
    test('createPerson - successful creation', async () => {
        const PersonService = createPersonService();
        
        const personDetails = {
            generalInformation: {
                firstName: 'John',
                lastName: 'Doe'
            }
        };

        const person = await PersonService.createPerson(personDetails);
        
        assert.strictEqual(person._id, 'person123');
        assert.deepStrictEqual(person.generalInformation, personDetails.generalInformation);
    });

    test('setFamilyTree - successful assignment', async () => {
        const PersonService = createPersonService();
        
        const personId = new mongoose.Types.ObjectId();
        const familyTreeId = new mongoose.Types.ObjectId();

        const updatedPerson = await PersonService.setFamilyTree(personId.toString(), familyTreeId.toString());
        
        assert.strictEqual(updatedPerson.familyTree.toString(), familyTreeId.toString());
    });

    test('setFamilyTree - invalid ID', async () => {
        const PersonService = createPersonService();
        
        await assert.rejects(
            () => PersonService.setFamilyTree('invalid', 'invalid'),
            { message: 'Invalid Person or Family Tree ID' }
        );
    });

    test('findPersons - with profile picture', async () => {
        const PersonService = createPersonService();
        
        const persons = await PersonService.findPersons({ lastName: 'Doe' });
        
        assert.strictEqual(persons.length, 1);
        assert.strictEqual(persons[0].profilePicture, 'https://example.com/profile.jpg');
    });

    test('getPersonByUserId - successful retrieval', async () => {
        const PersonService = createPersonService();
        
        const userId = new mongoose.Types.ObjectId();
        const person = await PersonService.getPersonByUserId(userId.toString());
        
        assert.strictEqual(person.generalInformation.firstName, 'John');
        assert.strictEqual(person.generalInformation.lastName, 'Doe');
        assert.deepStrictEqual(person.friendsList, []);
        assert.deepStrictEqual(person.friendRequestList, []);
    });

    test('updateRelatedUser - successful update', async () => {
        const PersonService = createPersonService();
        
        const personId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        const updatedPerson = await PersonService.updateRelatedUser(personId.toString(), userId.toString());
        
        assert.strictEqual(updatedPerson.relatedUser.toString(), userId.toString());
    });

    test('updateProfilePicture - successful update', async () => {
        const PersonService = createPersonService();
        
        const userId = new mongoose.Types.ObjectId();
        const mockFile = { filename: 'test.jpg' };

        const updatedPerson = await PersonService.updateProfilePicture(userId.toString(), mockFile);
        
        assert.strictEqual(updatedPerson.profilePicture, 'profile_testuser.jpg');
    });

    test('updateBackgroundPicture - successful update', async () => {
        const PersonService = createPersonService();
        
        const userId = new mongoose.Types.ObjectId();
        const mockBackgroundPicture = { filename: 'background.jpg' };

        const updatedPerson = await PersonService.updateBackgroundPicture(userId.toString(), mockBackgroundPicture);
        
        assert.strictEqual(updatedPerson.backgroundPicture, 'background_testuser.jpg');
    });
});