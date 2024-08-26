const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')

// HELPER
const helper = require('./test_helper')

// MODELS
const { User, Person } = require('../models/user')

describe('when there is initially one user in db', () => {
  let rootUserId;

  beforeEach(async () => {
    await User.deleteMany({})
    await Person.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })
    const savedUser = await user.save()
    rootUserId = savedUser.id
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('adding a child (registered user) to a user', async () => {
    const user = await User.findById(rootUserId)

    const newUser = {
      username: 'childUser',
      name: 'Child User',
      password: 'salainen',
    }

    const registeredChild = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    await api
      .post(`/api/tree/${user.id}/children`)
      .send({ childId: registeredChild.body.id })
      .expect(200)

    const updatedUser = await User.findById(user.id).populate('children')

    assert.strictEqual(updatedUser.children.length, 1)
    assert.strictEqual(updatedUser.children[0].username, 'childUser')
  })

  test('adding a parent (registered user) to a user', async () => {
    const user = await User.findById(rootUserId)

    const newParent = {
      username: 'parentUser',
      name: 'Parent User',
      password: 'salainen',
    }

    const registeredParent = await api
      .post('/api/users')
      .send(newParent)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    await api
      .post(`/api/tree/${user.id}/parents`)
      .send({ parentId: registeredParent.body.id })
      .expect(200)

    const updatedUser = await User.findById(user.id).populate('parents')

    assert.strictEqual(updatedUser.parents.length, 1)
    assert.strictEqual(updatedUser.parents[0].username, 'parentUser')
  })

  test('adding a child (non-registered individual) to a user', async () => {
    const user = await User.findById(rootUserId)

    const childInfo = {
      childName: 'Non-Registered Child',
      birthdate: '2000-01-01',
      deathdate: '2080-01-01',
    }

    await api
      .post(`/api/tree/${user.id}/children`)
      .send(childInfo)
      .expect(200)

    const updatedUser = await User.findById(user.id)

    assert.strictEqual(updatedUser.children.length, 1)
    assert.strictEqual(updatedUser.children[0].name, 'Non-Registered Child')
  })

  test('adding a parent (non-registered individual) to a user', async () => {
    const user = await User.findById(rootUserId)

    const parentInfo = {
      parentName: 'Non-Registered Parent',
      birthdate: '1960-01-01',
      deathdate: '2040-01-01',
    }

    await api
      .post(`/api/tree/${user.id}/parents`)
      .send(parentInfo)
      .expect(200)

    const updatedUser = await User.findById(user.id)

    assert.strictEqual(updatedUser.parents.length, 1)
    assert.strictEqual(updatedUser.parents[0].name, 'Non-Registered Parent')
  })
})

after(async () => {
  await mongoose.connection.close()
})
