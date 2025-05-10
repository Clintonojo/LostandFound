const request = require('supertest');
const { app, closeDatabase } = require('../server/server.js'); // Adjust the path to your server.js file
const http = require('http');

let server;

beforeAll((done) => {
    server = http.createServer(app);
    server.listen(0, () => { // Use port 0 to assign a random available port
        done();
    });
});

afterAll((done) => {
    server.close(done);
});

describe('API Tests', () => {
    test('should fetch all items from /items', async () => {
        const res = await request(app).get('/items');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('should register a new user', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: 'testuser', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.text).toBe('User registered successfully');
    });

    test('should fail to register a user with missing fields', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: '' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing username or password');
    });

    test('should log in a user with valid credentials', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.text).toContain('Login successful');
    });

    test('should fail to log in with invalid credentials', async () => {
        const res = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'wrongpassword' });
        expect(res.status).toBe(401);
        expect(res.text).toBe('Error: Incorrect username or password');
    });

    test('should submit a new item', async () => {
        const res = await request(app)
            .post('/submit-item')
            .send({
                itemName: 'Lost Wallet',
                description: 'Black leather wallet',
                lat: 40.7128,
                lng: -74.0060,
                phoneNumber: '123-456-7890',
                securityQuestions: [
                    { question: 'What color is the wallet?', answer: 'Black' },
                    { question: 'What brand is the wallet?', answer: 'Gucci' }
                ]
            });
        expect(res.status).toBe(200);
        expect(res.text).toBe('Item and security questions submitted successfully');
    });

    test('should fail to submit an item with missing fields', async () => {
        const res = await request(app)
            .post('/submit-item')
            .send({
                itemName: '',
                description: '',
                lat: '',
                lng: '',
                phoneNumber: '',
                securityQuestions: []
            });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing required fields');
    });

    test('should delete an item', async () => {
        const res = await request(app).delete('/delete-item/1'); // Replace '1' with a valid item ID
        expect(res.status).toBe(200);
        expect(res.text).toBe('Item deleted successfully');
    });

    test('should fail to delete a non-existent item', async () => {
        const res = await request(app).delete('/delete-item/9999'); // Use an invalid item ID
        expect(res.status).toBe(500);
        expect(res.text).toBe('Error deleting item');
    });
});
