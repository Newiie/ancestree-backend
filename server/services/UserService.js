// services/UserService.js
const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/UserRepository');
const PersonRepository = require('../repositories/PersonRepository');
const PersonNodeRepository = require('../repositories/PersonNodeRepository');
const FamilyTreeRepository = require('../repositories/FamilyTreeRepository');


class UserService {

    static async  sendFriendRequest(senderId, recipientId) {
      console.log("SERVCIE ", senderId, recipientId)
      const recipient = await UserRepository.findUserById(recipientId);
      if (!recipient) throw new Error('Recipient not found');
    
      if (!recipient.friendRequest.includes(senderId) && !recipient.friends.includes(senderId)) {
        recipient.friendRequest.push(senderId);
        await recipient.save();
        console.log('Friend request sent!');
      } else {
        console.log('Friend request already sent or already friends.');
      }
    }

    static async getUserFriendsField(gUserID) {
      const user = await UserRepository.getFriendsFields(gUserID);
      return user;
    }

    static async  acceptFriendRequest(gUserID, friendId) {
      const user = await UserRepository.findUserById(gUserID);
      const friend = await UserRepository.findUserById(friendId);
    
      if (!user || !friend) throw new Error('User or friend not found');
    
      // Ensure the sender has actually sent a friend request
      if (user.friendRequest.includes(friend.id)) {
        // Add each other to friends
        user.friends.push(friend.id);
        friend.friends.push(user.id);
        
        // Remove the sender from friend requests
        user.friendRequest = user.friendRequest.filter((id) => id != friend.id);
        friend.friendRequest = friend.friendRequest.filter((id) => id != user.id);
    
        // Save the changes
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
