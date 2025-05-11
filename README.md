# Lost and Found System

A web-based application to manage lost and found items. Users can report lost items, submit found items, and claim items using security questions. The system also includes an admin dashboard for managing items.

---

## **Features**
- **User Registration and Login**: Secure user authentication using hashed passwords and JWT tokens.
- **Submit Found Items**: Users can submit details of found items, including location and security questions.
- **View Items on Map**: Interactive map to display lost and found items using Leaflet.js.
- **Claim Items**: Users can claim items by answering security questions correctly.
- **Admin Dashboard**: Admins can view and delete items.
- **History Page**: Users can view and filter their submitted items.
- **Dark Mode**: Toggle between light and dark themes.
- **Language Support**: Switch between supported languages (e.g., English and Spanish).

---

## **Technologies Used**
### **Frontend**
- HTML, CSS, JavaScript
- Leaflet.js (for map integration)

### **Backend**
- Node.js, Express
- MySQL (Database)
- bcryptjs (Password hashing)
- jsonwebtoken (JWT authentication)

### **Testing**
- Jest (Backend and frontend tests)
- Sinon.js (Mocking/stubbing)
- JSDOM (Simulating the DOM for frontend tests)

---

## **Setup Instructions**

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/lost-and-found.git
cd lost-and-found2. Install Dependencies
bash
Copy
Edit
npm install
3. Configure Environment Variables
Create a .env file in the root directory and add:

ini
Copy
Edit
DB_HOST=localhost  
DB_USER=root  
DB_PASSWORD=Home1234?  
DB_NAME=lost_and_found  
JWT_SECRET=yourSecretKey  
4. Set Up the Database
Log into MySQL:

bash
Copy
Edit
mysql -u root -p
Create the database and tables:

sql
Copy
Edit
CREATE DATABASE lost_and_found;
USE lost_and_found;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    security_question VARCHAR(255) NOT NULL,
    security_answer VARCHAR(255) NOT NULL
);

CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    found_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
5. Start the Server
bash
Copy
Edit
node server/server.js
🚀 Usage
Open your browser and go to: http://localhost:3000 (or your configured port)

Available Features:

Register: Create a new user account

Login: Log in securely

Submit Found Items

View Map: Interactive lost and found map

Claim Items: Via security questions

Admin Dashboard: Item management for admins

History Page: View your own submissions

🧪 Testing
Run the tests using Jest:

bash
Copy
Edit
npm test
📁 Folder Structure
csharp
Copy
Edit
LostandFound/
├── node_modules/          # Installed dependencies
├── public/                # Frontend files
│   ├── index.html
│   ├── history.html
│   ├── submit-item.html
│   ├── styles.css
│   └── app.js
├── server/                # Backend files
│   └── server.js
├── .env                   # Environment variables
├── .gitignore             # Git ignore file
├── package.json           # Project config
├── package-lock.json      # Dependency lock file
└── README.md              # Project documentation
📄 License
This project is licensed under the MIT License. See the LICENSE file for details.

📬 Contact
Name: Clinton Ojo
Email: x21404496@Student.ncirl.ie
GitHub: ClintonOjo
