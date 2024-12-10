const PersonNodeRepository = require('../repositories/PersonNodeRepository');

class PersonNodeService {
    static async createPersonNode(nodeData) {
        const personNode = await PersonNodeRepository.createPersonNode(nodeData);
        return personNode;
    }

    static async setFamilyTree(nodeId, familyTreeId) {
        return await PersonNodeRepository.setFamilyTree(nodeId, familyTreeId);
    }

    static async addParent(nodeId, parentId) {
        return await PersonNodeRepository.addParentToNode(nodeId, parentId);
    }

    static async deletePersonNode(nodeId) {
        return await PersonNodeRepository.deletePersonNode(nodeId);
    }

    static async getPersonNodeById(nodeId, populate = []) {
        return await PersonNodeRepository.getPersonNodeById(nodeId, populate);
    }

    static async updatePersonNode(nodeId, updateData) {
        return await PersonNodeRepository.updatePersonNode(nodeId, updateData);
    }
}

module.exports = PersonNodeService;