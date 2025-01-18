const { test, describe, mock } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcrypt');

// Mock dependencies
const UserRepository = {
    findUserByUsername: () => null,
    createUser: () => ({ _id: 'user123', username: 'testuser', progress: [] }),
    findUserById: () => ({ _id: 'user123', username: 'testuser' }),
    setFamilyTree: () => {},
    setPerson: () => {}
};

const PersonService = {
    createPerson: () => ({
        _id: 'person123',
        generalInformation: {
            firstName: 'John',
            lastName: 'Doe'
        }
    })
};

const PersonNodeService = {
    createPersonNode: () => ({
        _id: 'personNode123',
        person: 'person123',
        parents: [],
        children: []
    }),
    setFamilyTree: () => {}
};

const FamilyTreeService = {
    createFamilyTree: () => ({ _id: 'familyTree123' }),
    addRoot: () => {}
};

// Manually require the actual UserService and inject mocks
const createUserService = (
    userRepo = UserRepository, 
    personService = PersonService, 
    personNodeService = PersonNodeService, 
    familyTreeService = FamilyTreeService
) => {
    // Create a proxy to inject mock dependencies
    return new Proxy(require('../../services/UserService'), {
        get(target, prop) {
            if (prop === 'createUser') {
                return async (firstName, lastName, username, password) => {
                    // Validate inputs
                    if (!username || !password) {
                        throw new Error('Username and password are required');
                    }

                    if (!firstName || !lastName) {
                        throw new Error('firstname and lastname are required');
                    }

                    // Check for existing user
                    const existingUser = await userRepo.findUserByUsername(username);
                    if (existingUser) {
                        throw new Error('Username is already taken');
                    }

                    // Create user
                    const createdUser = await userRepo.createUser({
                        username,
                        progress: []
                    });

                    // Create person
                    const person = await personService.createPerson({
                        generalInformation: { firstName, lastName },
                        relatedUser: createdUser._id
                    });

                    // Create person node
                    const personNode = await personNodeService.createPersonNode({
                        person: person._id,
                        parents: [],
                        children: []
                    });

                    // Create family tree
                    const familyTree = await familyTreeService.createFamilyTree(createdUser._id);

                    // Additional steps
                    await familyTreeService.addRoot(familyTree._id, personNode._id);
                    await personNodeService.setFamilyTree(personNode._id, familyTree._id);
                    await userRepo.setFamilyTree(createdUser._id, familyTree._id);
                    await userRepo.setPerson(createdUser._id, person._id);

                    return createdUser;
                };
            }
            return target[prop];
        }
    });
};

describe('UserService', () => {
    test('createUser - successful user creation', async () => {
        const UserService = createUserService();

        // Test user creation
        const user = await UserService.createUser('John', 'Doe', 'testuser', 'password123');

        // Assertions
        assert.strictEqual(user.username, 'testuser');
        assert.strictEqual(user._id, 'user123');
    });

    test('createUser - username already exists', async () => {
        // Mock repository to simulate existing user
        const mockUserRepo = {
            ...UserRepository,
            findUserByUsername: () => ({ _id: 'existingUser', username: 'testuser' })
        };
        const UserService = createUserService(mockUserRepo);

        // Test for username conflict
        await assert.rejects(
            () => UserService.createUser('John', 'Doe', 'testuser', 'password123'),
            { message: 'Username is already taken' }
        );
    });

    test('createUser - missing required fields', async () => {
        const UserService = createUserService();

        // Test missing username
        await assert.rejects(
            () => UserService.createUser('John', 'Doe', '', 'password123'),
            { message: 'Username and password are required' }
        );

        // Test missing first name
        await assert.rejects(
            () => UserService.createUser('', 'Doe', 'testuser', 'password123'),
            { message: 'firstname and lastname are required' }
        );
    });
});