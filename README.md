# Welcome to the Linkedin Scraper

You will be able to receive the data from an user's profile only by inseting the url of his linkedin profile.

1. Git clone the project

   ```bash
   git clone https://github.com/FedericoSanPedro/Linkedin_Application
   ```

2. Create a file called .env like .env.example and add the required needs for the project. In this case API_URL is your local IP.
And other one in scraper folder that contains your linkedin user and password.

3. Update the modules

   ```bash
   npx expo install
   npm install
   ```

   /scraper

   ```bash
   npm install
   ```

4. Start the app

   ```bash
   npx expo start
   ```
   
   /scraper

   ```bash
   node server.js
   ```

5. Open the website from npx expo start and insert the url like https://www.linkedin.com/in/federico-san-pedro/

In the future, some fields will be empty because Linkedin developers update the profile´s html code periodically. Therefore, the scraper must be updated accordingly. This can be managed by enabling HTML debugging and analyzing the changes.

There is also a possiblity that the sends you to a Hello World page, just press the index arrow.
If there is an issue with the default page showing "Welcome to Expo — Start by creating…” it is because of a node version problem. This project was created with version 24 and it worked with versions like 22. Try to update you version to see the index page.