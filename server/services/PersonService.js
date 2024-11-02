const PersonRepository = require('../repositories/PersonRepository');

class PersonService {
    static async getPersonById(personId) {
        return await PersonRepository.getPersonById(personId);
    }

    static async updatePersonGeneralInformation(personId, generalInfo) {
        return await PersonRepository.updatePersonGeneralInformation(personId, generalInfo);
    }

    static async updateAddress(personId, addressData) {
        return await PersonRepository.updateAddress(personId, addressData);
    }

    static async updateVitalInformation(personId, vitalInfo) {
        return await PersonRepository.updateVitalInformation(personId, vitalInfo);
    }

    static async updateInterests(personId, interestsData) {
        return await PersonRepository.updateInterests(personId, interestsData);
    }

    static async updateEmergencyContact(personId, emergencyContactData) {
        return await PersonRepository.updateEmergencyContact(personId, emergencyContactData);
    }
}

module.exports = PersonService;

