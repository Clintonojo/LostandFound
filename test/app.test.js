const { JSDOM } = require('jsdom');
const sinon = require('sinon');
const { expect } = require('chai');

describe('Frontend Tests', () => {
    let dom;
    let document;
    let window;
    let fetchStub;

    beforeEach(() => {
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <form id="registerForm">
                    <input id="username" value="testuser" />
                    <input id="password" value="password123" />
                    <button type="submit">Register</button>
                </form>
                <form id="loginForm">
                    <input id="username" value="testuser" />
                    <input id="password" value="password123" />
                    <button type="submit">Login</button>
                </form>
            </body>
            </html>
        `, { url: 'http://localhost' });

        document = dom.window.document;
        window = dom.window;

        fetchStub = sinon.stub(window, 'fetch');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should handle registration form submission', async () => {
        const registerForm = document.getElementById('registerForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        fetchStub.resolves(new window.Response('User registered successfully', { status: 200 }));

        const submitEvent = new dom.window.Event('submit');
        registerForm.dispatchEvent(submitEvent);

        expect(fetchStub.calledOnce).to.be.true;
        const fetchArgs = fetchStub.getCall(0).args;
        expect(fetchArgs[0]).to.equal('/register');
        expect(fetchArgs[1].method).to.equal('POST');
        const body = JSON.parse(fetchArgs[1].body);
        expect(body.username).to.equal(usernameInput.value);
        expect(body.password).to.equal(passwordInput.value);
    });

    it('should handle login form submission', async () => {
        const loginForm = document.getElementById('loginForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        fetchStub.resolves(new window.Response('Login successful', { status: 200 }));

        const submitEvent = new dom.window.Event('submit');
        loginForm.dispatchEvent(submitEvent);

        expect(fetchStub.calledOnce).to.be.true;
        const fetchArgs = fetchStub.getCall(0).args;
        expect(fetchArgs[0]).to.equal('/login');
        expect(fetchArgs[1].method).to.equal('POST');
        const body = JSON.parse(fetchArgs[1].body);
        expect(body.username).to.equal(usernameInput.value);
        expect(body.password).to.equal(passwordInput.value);
    });

    test('example test', () => {
        expect(true).toBe(true); // Use Jest's expect
    });
});