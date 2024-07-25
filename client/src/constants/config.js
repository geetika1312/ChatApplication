// export const server = import.meta.env.VITE_SERVER;



export const server = import.meta.env.VITE_SERVER || "http://localhost:3000";

console.log("Server URL:", server); // Check the console for the correct value
console.log("Environment Variables:", import.meta.env);
