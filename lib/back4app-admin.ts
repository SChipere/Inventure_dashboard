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

export type UpdateUserData = {
  objectId: string; // Required for updating
  username?: string;
  email?: string;
  password?: string; // Only if changing password
  Acess_level?: string;
  emailVerified?: boolean;
};

export type NotificationData = {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
};

/**
 * Fetches all users from the Back4App _User class.
 * This function relies on an existing Parse session or public read permissions.
 * @returns A promise that resolves to an array of AdminUser objects.
 */
export async function fetchAllUsers(): Promise<AdminUser[]> {
  try {
    const query = new Parse.Query(Parse.User);
    query.descending('createdAt'); // Order by creation date, newest first
    // Limit and skip for pagination could be added here if needed for large datasets
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
 * This function relies on an existing Parse session with create permissions.
 * @param userData The data for the new user.
 * @returns A promise that resolves to the created AdminUser object.
 */
export async function createUser(userData: CreateUserData): Promise<AdminUser> {
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
 * Updates an existing user in the Back4App _User class.
 * This function relies on an existing Parse session with update permissions.
 * @param userData The data for the user to update, including objectId.
 * @returns A promise that resolves to the updated AdminUser object.
 */
export async function updateUser(userData: UpdateUserData): Promise<AdminUser> {
  try {
    const query = new Parse.Query(Parse.User);
    const userToUpdate = await query.get(userData.objectId); // Fetch the user object by objectId

    if (userData.username) {
      userToUpdate.set('username', userData.username);
    }
    if (userData.email) {
      userToUpdate.set('email', userData.email);
    }
    if (userData.password) {
      userToUpdate.set('password', userData.password); // Only set if a new password is provided
    }
    if (userData.Acess_level) {
      userToUpdate.set('Acess_level', userData.Acess_level);
    }
    if (typeof userData.emailVerified === 'boolean') {
      userToUpdate.set('emailVerified', userData.emailVerified);
    }

    const updatedUser = await userToUpdate.save(); // Save the changes

    return {
      objectId: updatedUser.id,
      username: updatedUser.get('username'),
      email: updatedUser.get('email'),
      emailVerified: updatedUser.get('emailVerified') || false,
      createdAt: updatedUser.createdAt?.toISOString() || '',
      updatedAt: updatedUser.updatedAt?.toISOString() || '',
      Acess_level: updatedUser.get('Acess_level') || 'user',
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error(`Failed to update user: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes a user from the Back4App _User class.
 * This function relies on an existing Parse session with delete permissions.
 * @param userId The objectId of the user to delete.
 * @returns A promise that resolves when the user is deleted.
 */
export async function deleteUser(userId: string): Promise<void> {
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
 * This function relies on an existing Parse session with appropriate permissions for Cloud Functions.
 * @param notificationData The notification content.
 * @returns A promise that resolves when the notification is "sent".
 */
export async function sendBroadcastNotification(notificationData: NotificationData): Promise<void> {
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
 * This function relies on an existing Parse session or public read permissions.
 * @returns A promise that resolves to an object containing user statistics.
 */
export async function getUserStatistics() {
  try {
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

