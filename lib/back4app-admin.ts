// lib/back4app-admin.ts
// CORRECTED IMPORT: Use 'parse' for web applications
import Parse from 'parse';
import { v4 as uuidv4 } from 'uuid'; // For generating temporary passwords

// Initialize Parse with your Back4App credentials
// IMPORTANT: In a real production app, never expose your keys directly in client-side code.
// Use environment variables or a secure backend proxy.
const APP_ID = 'QGvrhwxOhWwRe1ljUk4uyWj7UA7xjxEDwP1vhdsw';
const JAVASCRIPT_KEY = 'jh0aKxm3H9f62YisAgvLDI1cpF7DfIySlXgwGjcS';
const SERVER_URL = 'https://parseapi.back4app.com/'; // Your Back4App server URL

// Admin credentials (FOR DEVELOPMENT/DEMO ONLY - DO NOT USE IN PRODUCTION AS IS)
// You MUST replace these with secure environment variables or a proper authentication flow
const ADMIN_USERNAME = 'your_admin_username'; // <--- REPLACE THIS WITH YOUR ADMIN USERNAME
const ADMIN_PASSWORD = 'your_admin_password'; // <--- REPLACE THIS WITH YOUR ADMIN PASSWORD

// Check if Parse is already initialized to prevent re-initialization warnings
if (!(Parse as any)._initializeHasRun) {
  Parse.initialize(APP_ID, JAVASCRIPT_KEY);
  Parse.serverURL = SERVER_URL;
}

// Define the types used in the application
export type AdminUser = {
  objectId: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  Acess_level?: string; // Access level field as per schema
};

export type CreateUserData = {
  username: string;
  email: string;
  password: string;
  Acess_level?: string;
};

export type NotificationData = {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
};

/**
 * Attempts to log in an admin user to establish a session.
 * This is crucial for operations that require authentication.
 * @returns A promise that resolves to the logged-in Parse.User object.
 */
export async function loginAdmin(): Promise<Parse.User> {
  try {
    const user = await Parse.User.logIn(ADMIN_USERNAME, ADMIN_PASSWORD);
    console.log('Admin user logged in:', user.get('username'));
    return user;
  } catch (error) {
    console.error('Error logging in admin:', error);
    throw new Error(`Failed to log in admin: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches all users from the Back4App _User class.
 * Ensures an admin session is active before fetching.
 * @returns A promise that resolves to an array of AdminUser objects.
 */
export async function fetchAllUsers(): Promise<AdminUser[]> {
  try {
    // Ensure admin is logged in before making requests that might require authentication
    // In a real app, you'd manage sessions more robustly (e.g., check current session first)
    if (!Parse.User.current()) {
      await loginAdmin(); // Attempt to log in if no current user
    }

    const query = new Parse.Query(Parse.User);
    query.descending('createdAt'); // Order by creation date, newest first
    const parseUsers = await query.find();

    return parseUsers.map((parseUser) => ({
      objectId: parseUser.id,
      username: parseUser.get('username'),
      email: parseUser.get('email'),
      emailVerified: parseUser.get('emailVerified') || false,
      createdAt: parseUser.createdAt?.toISOString() || '',
      updatedAt: parseUser.updatedAt?.toISOString() || '',
      Acess_level: parseUser.get('Acess_level') || 'user', // Default to 'user' if not set
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a new user in the Back4App _User class.
 * Ensures an admin session is active before creating a user.
 * @param userData The data for the new user.
 * @returns A promise that resolves to the created AdminUser object.
 */
export async function createUser(userData: CreateUserData): Promise<AdminUser> {
  // Ensure admin is logged in before creating a user
  if (!Parse.User.current()) {
    await loginAdmin();
  }

  const { username, email, password, Acess_level } = userData;
  const user = new Parse.User();

  user.set('username', username);
  user.set('email', email);
  user.set('password', password);
  if (Acess_level) {
    user.set('Acess_level', Acess_level);
  } else {
    user.set('Acess_level', 'user'); // Default access level
  }

  try {
    const newUser = await user.signUp();
    return {
      objectId: newUser.id,
      username: newUser.get('username'),
      email: newUser.get('email'),
      emailVerified: newUser.get('emailVerified') || false,
      createdAt: newUser.createdAt?.toISOString() || '',
      updatedAt: newUser.updatedAt?.toISOString() || '',
      Acess_level: newUser.get('Acess_level') || 'user',
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes a user from the Back4App _User class.
 * Ensures an admin session is active before deleting a user.
 * @param userId The objectId of the user to delete.
 * @returns A promise that resolves when the user is deleted.
 */
export async function deleteUser(userId: string): Promise<void> {
  // Ensure admin is logged in before deleting a user
  if (!Parse.User.current()) {
    await loginAdmin();
  }
  try {
    const user = new Parse.User();
    user.set('objectId', userId); // Set the objectId to identify the user
    await user.destroy();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Sends a simulated broadcast notification.
 * Ensures an admin session is active before sending a notification.
 * @param notificationData The notification content.
 * @returns A promise that resolves when the notification is "sent".
 */
export async function sendBroadcastNotification(notificationData: NotificationData): Promise<void> {
  // Ensure admin is logged in before sending notification
  if (!Parse.User.current()) {
    await loginAdmin();
  }
  console.log('Simulating broadcast notification:', notificationData);
  // In a real application, you would interact with a Parse Cloud Function here
  // Example (requires a Cloud Code function named 'sendGlobalNotification'):
  // await Parse.Cloud.run('sendGlobalNotification', {
  //   title: notificationData.title,
  //   message: notificationData.message,
  //   type: notificationData.type
  // });
  return Promise.resolve(); // Simulate success
}

/**
 * Generates a random temporary password.
 * @returns A randomly generated string.
 */
export function generateTemporaryPassword(): string {
  return uuidv4().slice(0, 8); // Generate a UUID and take the first 8 characters
}

/**
 * Fetches and calculates user statistics.
 * Ensures an admin session is active before fetching statistics.
 * @returns A promise that resolves to an object containing user statistics.
 */
export async function getUserStatistics() {
  try {
    // Ensure admin is logged in before making requests that might require authentication
    if (!Parse.User.current()) {
      await loginAdmin(); // Attempt to log in if no current user
    }

    const query = new Parse.Query(Parse.User);
    const totalUsers = await query.count();

    const verifiedUsersQuery = new Parse.Query(Parse.User);
    verifiedUsersQuery.equalTo('emailVerified', true);
    const verifiedUsers = await verifiedUsersQuery.count();

    const adminUsersQuery = new Parse.Query(Parse.User);
    adminUsersQuery.equalTo('Acess_level', 'admin');
    const adminUsers = await adminUsersQuery.count();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsersQuery = new Parse.Query(Parse.User);
    recentUsersQuery.greaterThanOrEqualTo('createdAt', sevenDaysAgo);
    const recentUsers = await recentUsersQuery.count();

    return {
      totalUsers,
      verifiedUsers,
      adminUsers,
      recentUsers,
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw new Error(`Failed to get user statistics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

