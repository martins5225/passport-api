# Passport Vision API

Passport Vision API is a service that extracts information from passport images using Google Cloud Vision API and provides the date of birth and expiry date in a standardized format.

## Prerequisites

Before you can use this API, ensure you have the following dependencies and components installed:

- Node.js (>= 16.20.1)
- NPM (Node Package Manager)

## Getting Started

To start the Passport Vision API, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/martins5225/passport-api.git
cd passport-vision-api
```

2. Install project dependencies:

```bash
npm install
```

3. Configure your environment variables by creating a `.env` file in the project root directory. Add the following variables:

```dotenv
GOOGLE_CLOUD_PROJECT_ID=your-project-id
MONGODB_URI=your-mongo-uri
PORT=3000
```

Replace `your-project-id` with your Google Cloud Project ID and `mongoDB URI` with the path to your database URI.

4. Start the API server:

```bash
npm run dev
```

The API will be accessible at `http://localhost:3000`. You can change the `PORT` in the `.env` file.

## Endpoints

The following API endpoints are available:

- `POST /passport/process`: Submit a passport image for processing. The API will extract date of birth and expiry date.

Example request (using `curl`):

```bash
curl -X POST -F "name=John Doe" -F "file=@passport.jpg" http://localhost:3000/passport/process
```

Example response:

```json
{
 "dateOfBirth": "DD-MM-YY",
 "expiryDate": "DD-MM-YY"
}
```

## Testing

You can test the API locally by using a tool like `curl` or Postman to send POST requests to the `POST /passport/process` endpoint. Make sure to include the `name` field and a passport image file in the request.
You can also test the API live with the url `https://api-passport-service.onrender.com/passport/process`

## Deployment

To deploy this API to a production environment, follow these steps:

1. Deploy your Node.js application to a cloud server or platform of your choice.
2. Set the appropriate environment variables in your production environment.
3. Ensure that your service account key and Google Cloud Vision API credentials are correctly configured.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
