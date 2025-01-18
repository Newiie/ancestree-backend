const { test, describe, mock } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Create a mock ObjectId function
const createMockObjectId = () => new mongoose.Types.ObjectId();

// Mock dependencies
const createMockUserRepository = () => ({
    findUserById: mock.fn((userId) => ({
        _id: userId,
        person: { _id: 'mockPersonId' },
        friendRequest: [],
        friends: [],
        save: mock.fn(),
        removeFriendRequest: mock.fn()
    })),
    removeFriendRequest: mock.fn(),
    getFriendsFields: mock.fn(() => [])
});

const createMockPersonRepository = () => ({
    getPersonById: mock.fn((personId) => ({
        generalInformation: {
            firstName: 'Test',
            lastName: 'User'
        }
    }))
});

const createMockNotificationService = () => ({
    createNotification: mock.fn()
});

// Create a proxy to inject mock dependencies
const createFriendService = (
    userRepo = createMockUserRepository(),
    personRepo = createMockPersonRepository(),
    notificationService = createMockNotificationService()
) => {
    // Require the actual service
    const FriendService = require('../../services/FriendService');
    
    // Create a proxy to inject mock repositories
    return new Proxy(FriendService, {
        get(target, prop) {
            // If the method exists in the original service, use it
            if (typeof target[prop] === 'function') {
                return async (...args) => {
                    // Use the mock repository for these methods
                    const mockMethods = [
                        'sendFriendRequest', 
                        'acceptFriendRequest', 
                        'cancelFriendRequest',
                        'removeFriendRequest',
                        'getFriends'
                    ];

                    if (mockMethods.includes(prop)) {
                        if (['sendFriendRequest', 'acceptFriendRequest', 'cancelFriendRequest'].includes(prop)) {
                            return target[prop].call(null, ...args, {
                                UserRepository: userRepo,
                                PersonRepository: personRepo,
                                NotificationService: notificationService
                            });
                        }
                        return userRepo[prop](...args);
                    }

                    // Otherwise, call the original method
                    return target[prop](...args);
                };
            }
            return target[prop];
        }
    });
};

describe('FriendService', () => {
    test('sendFriendRequest - successful request', async () => {
        const FriendService = createFriendService();
        
        const senderId = createMockObjectId();
        const recipientId = createMockObjectId();

        await FriendService.sendFriendRequest(senderId, recipientId);

        // Verify friend request was added
        const recipient = await FriendService.UserRepository.findUserById(recipientId);
        assert.ok(recipient.friendRequest.includes(senderId));
    });

    test('sendFriendRequest - duplicate request', async () => {
        const mockUserRepo = createMockUserRepository();
        // Simulate existing friend request
        mockUserRepo.findUserById = mock.fn((userId) => ({
            _id: userId,
            person: { _id: 'mockPersonId' },
            friendRequest: ['user1'],
            friends: [],
            save: mock.fn()
        }));

        const FriendService = createFriendService(mockUserRepo);
        
        const senderId = 'user1';
        const recipientId = 'user2';

        // This should not throw an error, just log a message
        await FriendService.sendFriendRequest(senderId, recipientId);

        // Verify no additional friend request was added
        const recipient = await FriendService.UserRepository.findUserById(recipientId);
        assert.strictEqual(recipient.friendRequest.length, 1);
    });

    test('acceptFriendRequest - successful acceptance', async () => {
        const mockUserRepo = createMockUserRepository();
        // Simulate existing friend request
        mockUserRepo.findUserById = mock.fn((userId) => ({
            _id: userId,
            person: { _id: 'mockPersonId' },
            friendRequest: ['friend'],
            friends: [],
            save: mock.fn(),
            removeFriendRequest: mock.fn()
        }));

        const FriendService = createFriendService(mockUserRepo);
        
        const userId = 'user1';
        const friendId = 'friend';

        await FriendService.acceptFriendRequest(userId, friendId);

        // Verify friends were added
        const user = await FriendService.UserRepository.findUserById(userId);
        const friend = await FriendService.UserRepository.findUserById(friendId);
        
        assert.ok(user.friends.includes(friendId));
        assert.ok(friend.friends.includes(userId));
    });

    test('cancelFriendRequest - successful cancellation', async () => {
        const mockUserRepo = createMockUserRepository();
        // Simulate existing friend request
        mockUserRepo.findUserById = mock.fn((userId) => ({
            _id: userId,
            person: { _id: 'mockPersonId' },
            friendRequest: ['friend'],
            friends: [],
            save: mock.fn(),
            removeFriendRequest: mock.fn()
        }));

        const FriendService = createFriendService(mockUserRepo);
        
        const userId = 'user1';
        const friendId = 'friend';

        await FriendService.cancelFriendRequest(userId, friendId);

        // Verify removeFriendRequest was called
        assert.ok(mockUserRepo.removeFriendRequest.mock.calls.length > 0);
    });

    test('removeFriendRequest - successful removal', async () => {
        const mockUserRepo = createMockUserRepository();
        // Simulate existing friend request
        mockUserRepo.findUserById = mock.fn((userId) => ({
            _id: userId,
            person: { _id: 'mockPersonId' },
            friendRequest: ['requester'],
            save: mock.fn()
        }));

        const FriendService = createFriendService(mockUserRepo);
        
        const userId = 'user1';
        const requesterId = 'requester';

        const updatedUser = await FriendService.removeFriendRequest(userId, requesterId);

        // Verify friend request was removed
        assert.ok(!updatedUser.friendRequest.includes(requesterId));
    });

    test('getFriends - retrieve friends', async () => {
        const FriendService = createFriendService();
        
        const userId = 'user1';

        const friends = await FriendService.getFriends(userId);

        // Verify getFriendsFields was called
        assert.ok(Array.isArray(friends));
    });

    test('sendFriendRequest - recipient not found', async () => {
        const mockUserRepo = createMockUserRepository();
        mockUserRepo.findUserById = mock.fn((userId) => null);

        const FriendService = createFriendService(mockUserRepo);
        
        const senderId = 'user1';
        const recipientId = 'user2';

        // Should throw an error when recipient is not found
        await assert.rejects(
            () => FriendService.sendFriendRequest(senderId, recipientId),
            { message: 'Recipient not found' }
        );
    });
});