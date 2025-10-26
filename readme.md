***To Install Required Frontend Packages***

npm i --save @fortawesome/react-fontawesome@latest 
npm i --save @fortawesome/fontawesome-svg-core

npm i --save @fortawesome/free-solid-svg-icons
npm i --save @fortawesome/free-regular-svg-icons

npm install js-cookie
npm install chart.js react-chartjs-2

***To Install Requred Backend Packages***
python -m venv venv
source .venv/bin/activate 
pip install -r requirements

***To Start the Application***

Frontend: npm run start
(Ensure that the frontend is running on localhost:3000)

Backend: python manage.py runserver localhost:8000

***To Resolve Backend Gmail API issues***
1. If the token is expired, please delete token.json

2. in browser please run: http://localhost:3000/authorise-gmail/


it will prompt you to sign in to your gmail account and thus authorise ManningMarkets to send emails on your behalf, this is essential for the backend email API.

Message: Gmail Authorisation successful!, ensures that correct steps have been taken



