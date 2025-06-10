import credentials from './credentials.json';

export default function () {
  console.log("Credentials loaded:", credentials.length);
  console.log(JSON.stringify(credentials[0]));
}