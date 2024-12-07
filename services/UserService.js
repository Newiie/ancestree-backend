// services/UserService.js
const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/UserRepository');
const PersonRepository = require('../repositories/PersonRepository');
const PersonNodeRepository = require('../repositories/PersonNodeRepository');
const FamilyTreeRepository = require('../repositories/FamilyTreeRepository');
const Notification = require('../models/Notification');

class UserService {

    static async sendFriendRequest(senderId, recipientId) {
      console.log("SERVCIE ", senderId, recipientId)
      const recipient = await UserRepository.findUserById(recipientId);
      const sender = await UserRepository.findUserById(senderId);
      const senderPerson = await PersonRepository.getPersonById(sender.person._id);

      if (!recipient) throw new Error('Recipient not found');
    
      if (!recipient.friendRequest.includes(senderId) && !recipient.friends.includes(senderId)) {
        recipient.friendRequest.push(senderId);

        const notification = new Notification({
          recipient: recipientId,
          message: 'Friend request from ' + senderPerson.generalInformation.firstName + ' ' + senderPerson.generalInformation.lastName,
          type: 'FRIEND_REQUEST',
          relatedId: senderId
        });

        await notification.save();
        await recipient.save();
        console.log('Friend request sent!');
      } else {
        console.log('Friend request already sent or already friends.');
      }
    }

    static async markNotificationAsRead(notificationId) {
      try {
        const notification = await Notification.findByIdAndUpdate(
          notificationId,
          { isRead: true },
          { new: true }
        );
        return notification;
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    }

    static async getUserNotifications(gUserID, isRead = false) {  
      try {
        const notifications = await Notification.find({ recipient: gUserID, isRead });
        return notifications;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
    }

    static async getUserFriendsField(gUserID) {
      const user = await UserRepository.getFriendsFields(gUserID);
      return user;
    }

    static async  acceptFriendRequest(gUserID, friendId) {
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
        
        const notificationFriend = new Notification({
          recipient: friend.id,
          message: 'Friend request accepted by ' + userPerson.generalInformation.firstName + ' ' + userPerson.generalInformation.lastName,
          type: 'FRIEND_REQUEST',
          relatedId: user.id
        });

        const notificationUser = new Notification({
          recipient: user.id,
          message: 'You are now friends with ' + friendPerson.generalInformation.firstName + ' ' + friendPerson.generalInformation.lastName,
          type: 'FRIEND_REQUEST',
          relatedId: friend.id
        });

        await notificationFriend.save();
        await notificationUser.save();

        await user.save();
        await friend.save();
    
        console.log('Friend request accepted!');
      } else {
        console.log('No friend request found from this user.');
      }
    }
    

    static async createUser(firstName, lastName, username, password) {
        if (!username || !password) {
          throw new Error('Username and password are required');
        }

        if (!firstName || !lastName) {
          console.log("FIRST NAME", firstName); 
          console.log("LAST NAME", lastName);
          throw new Error('firstname and lastname are required');
        }

        const existingUser = await UserRepository.findUserByUsername(username);
        if (existingUser) {
          throw new Error('Username is already taken');
        }
    
        const passwordHash = await bcrypt.hash(password, 10);
        
        console.log('firstName', firstName);
        console.log('lastName', lastName);
        const user = await UserRepository.createUser({
          username,
          passwordHash
        });

        const person = await PersonRepository.createPerson({
          generalInformation: {
            firstName,
            lastName
          },
            relatedUser: user._id,
            birthdate: null,
            deathdate: null
        });
 
        const personNode = await PersonNodeRepository.createPersonNode({
          person: person._id,
          parents: [],
          children: [],
        });
    
        const familyTree = await FamilyTreeRepository.createFamilyTree({
          root: personNode._id,
          owner: user._id
        });

      
        personNode.familyTree = familyTree._id;
        user.familyTree = familyTree._id;
        user.person = person._id;
        person.treeId = familyTree._id;
        await personNode.save();
        await user.save();
        await person.save();
    
        return user;
    }

    static async getAllUsersWithRelations() {
        const users = await UserRepository.getAllUsersWithFamilyTree();
        
        const populatedUsers = await Promise.all(
          users.map(async (user) => {
            // const relations = await PersonNodeRepository.getPersonNodeById(user.familyTree.root, ['parents', 'children']);
            return {
              ...user.toJSON(),
              // relations: relations ? relations.toJSON() : null,
            };
          })
        );
        return populatedUsers;
    }
}

module.exports = UserService;
