const UserRepository = require('../repositories/UserRepository');
const PersonRepository = require('../repositories/PersonRepository');
const NotificationService = require('./NotificationService');

/**
 * Service for managing friend relationships between users.
 * Note: Friend relationships are stored in the User model, so this service
 * uses UserRepository directly rather than going through UserService to avoid
 * unnecessary abstraction.
 */
class FriendService {
    static async sendFriendRequest(senderId, recipientId) {
        const [recipient, sender] = await Promise.all([
            UserRepository.findUserById(recipientId),
            UserRepository.findUserById(senderId)
        ]);
        const senderPerson = await PersonRepository.getPersonById(sender.person._id);
  
        if (!recipient) throw new Error('Recipient not found');
      
        if (!recipient.friendRequest.includes(senderId) && !recipient.friends.includes(senderId)) {
            recipient.friendRequest.push(senderId);
            await recipient.save();
  
            await NotificationService.createNotification(
                recipientId, 
                'Friend request from ' + senderPerson.generalInformation.firstName + ' ' + senderPerson.generalInformation.lastName, 
                'FRIEND_REQUEST', 
                senderId
            );
            console.log('Friend request sent!');
        } else {
            console.log('Friend request already sent or already friends.');
        }
    }

    static async acceptFriendRequest(gUserID, friendId) {
        const [user, friend] = await Promise.all([
            UserRepository.findUserById(gUserID),
            UserRepository.findUserById(friendId)
        ]);
        
        const [userPerson, friendPerson] = await Promise.all([
            PersonRepository.getPersonById(user.person._id),
            PersonRepository.getPersonById(friend.person._id)
        ]);
  
        if (!user || !friend) throw new Error('User or friend not found');
      
        if (user.friendRequest.includes(friend.id)) {
            // Update both users' friends lists
            user.friends.push(friend.id);
            friend.friends.push(user.id);
          
            // Remove friend requests
            await UserRepository.removeFriendRequest(user.id, friend.id);
            await UserRepository.removeFriendRequest(friend.id, user.id);
          
            // Save both users
            await Promise.all([
                user.save(),
                friend.save(),
                NotificationService.createNotification(
                    friend.id,
                    'Friend request accepted by ' + userPerson.generalInformation.firstName + ' ' + userPerson.generalInformation.lastName,
                    'FRIEND_REQUEST',
                    user.id
                ),
                NotificationService.createNotification(
                    user.id,
                    'You are now friends with ' + friendPerson.generalInformation.firstName + ' ' + friendPerson.generalInformation.lastName,
                    'FRIEND_REQUEST',
                    friend.id
                )
            ]);
        } else {
            console.log('No friend request found from this user.');
        }
    }

    static async cancelFriendRequest(gUserID, friendId) {
        const [user, friend] = await Promise.all([
            UserRepository.findUserById(gUserID),
            UserRepository.findUserById(friendId)
        ]);

        if (!user || !friend) throw new Error('User or friend not found');
      
        if (user.friendRequest.includes(friend.id)) {
            await UserRepository.removeFriendRequest(user.id, friend.id);
        } else {
            console.log('No friend request found from this user.');
        }
    }

    static async removeFriendRequest(userId, requesterId) {
        const user = await UserRepository.findUserById(userId);
        if (!user) throw new Error('User not found');
        
        user.friendRequest = user.friendRequest.filter(id => id != requesterId);
        return await user.save();
    }

    static async getFriends(gUserID) {
        return await UserRepository.getFriendsFields(gUserID);
    }
}

module.exports = FriendService;
