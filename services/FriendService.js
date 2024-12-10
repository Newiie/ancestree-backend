const UserRepository = require('../repositories/UserRepository');
const PersonRepository = require('../repositories/PersonRepository');
const NotificationService = require('./NotificationService');

class FriendService {
    static async sendFriendRequest(senderId, recipientId) {
        const recipient = await UserRepository.findUserById(recipientId);
        const sender = await UserRepository.findUserById(senderId);
        const senderPerson = await PersonRepository.getPersonById(sender.person._id);
  
        if (!recipient) throw new Error('Recipient not found');
      
        if (!recipient.friendRequest.includes(senderId) && !recipient.friends.includes(senderId)) {
            recipient.friendRequest.push(senderId);
  
            await NotificationService.createNotification(
                recipientId, 
                'Friend request from ' + senderPerson.generalInformation.firstName + ' ' + senderPerson.generalInformation.lastName, 
                'FRIEND_REQUEST', 
                senderId
            );
  
            await recipient.save();
            console.log('Friend request sent!');
        } else {
            console.log('Friend request already sent or already friends.');
        }
    }

    static async acceptFriendRequest(gUserID, friendId) {
        const user = await UserRepository.findUserById(gUserID);
        const friend = await UserRepository.findUserById(friendId);
  
        const userPerson = await PersonRepository.getPersonById(user.person._id);
        const friendPerson = await PersonRepository.getPersonById(friend.person._id);
  
        if (!user || !friend) throw new Error('User or friend not found');
      
        if (user.friendRequest.includes(friend.id)) {
            user.friends.push(friend.id);
            friend.friends.push(user.id);
          
            user.friendRequest = user.friendRequest.filter((id) => id != friend.id);
            friend.friendRequest = friend.friendRequest.filter((id) => id != user.id);
          
            await NotificationService.createNotification(
                friend.id,
                'Friend request accepted by ' + userPerson.generalInformation.firstName + ' ' + userPerson.generalInformation.lastName,
                'FRIEND_REQUEST',
                user.id
            );
  
            await NotificationService.createNotification(
                user.id,
                'You are now friends with ' + friendPerson.generalInformation.firstName + ' ' + friendPerson.generalInformation.lastName,
                'FRIEND_REQUEST',
                friend.id
            );
  
            await friend.save();
            await user.save();
        } else {
            console.log('No friend request found from this user.');
        }
    }

    static async cancelFriendRequest(gUserID, friendId) {
        const user = await UserRepository.findUserById(gUserID);
        const friend = await UserRepository.findUserById(friendId);
  
        if (!user || !friend) throw new Error('User or friend not found');
      
        if (user.friendRequest.includes(friend.id)) {
            user.friendRequest = user.friendRequest.filter((id) => id != friend.id);
            await user.save();
        } else {
            console.log('No friend request found from this user.');
        }
    }

    static async getFriends(gUserID) {
        return await UserRepository.getFriendsFields(gUserID);
    }
}

module.exports = FriendService;
