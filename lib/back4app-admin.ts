// lib/back4app-admin.ts
import Parse from 'parse';
import { v4 as uuidv4 } from 'uuid'; // For generating temporary passwords

const APP_ID = 'QGvrhwxOhWwRe1ljUk4uyWj7UA7xjxEDwP1vhdsw';
const JAVASCRIPT_KEY = 'jh0aKxm3H9f62YisAgvLDI1cpF7DfIySlXgwGjcS';
const SERVER_URL = 'https://parseapi.back4app.com/';

if (!(Parse as any)._initializeHasRun) {
  Parse.initialize(APP_ID, JAVASCRIPT_KEY);
  Parse.serverURL = SERVER_URL;
}

// Define the Employee type to match your "Employees" class schema
export type Employee = {
  objectId: string;
  User: string; // Corresponds to 'User' field in Employees class (username)
  Email: string; // Corresponds to 'Email' field in Employees class
  Access_level?: string; // Corresponds to 'Access_level' field in Employees class
  createdAt: string;
  updatedAt: string;
};

// AdminUser type will now effectively be an Employee for display purposes
export type AdminUser = Employee;

export type CreateUserData = {
  username: string;
  email: string;
  password: string;
  Acess_level?: string;
};

export type UpdateUserData = {
  objectId: string; // objectId of the Employee class
  username?: string; // Corresponds to 'User' in Employees
  email?: string; // Corresponds to 'Email' in Employees
  password?: string;
  Acess_level?: string; // Corresponds to 'Access_level' in Employees
  emailVerified?: boolean; // From _User class - will be set to true on creation/update for now
};

export type NotificationData = {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
};

/**
 * Fetches all users from the "Employees" class with "@inventure.mu" email domain.
 * @returns A promise that resolves to an array of Employee objects.
 */
export async function fetchAllUsers(): Promise<Employee[]> {
  try {
    const query = new Parse.Query('Employees');
    query.limit(1000); // Fetch up to 1000 records
    query.descending('createdAt');
    query.contains('Email', '@inventure.mu'); // Filter by email domain

    const parseEmployees = await query.find();
    console.log("✅ Employees fetched:", parseEmployees.length);

    return parseEmployees.map((employee) => ({
      objectId: employee.id,
      User: employee.get('User'),
      Email: employee.get('Email'),
      Access_level: employee.get('Access_level'),
      createdAt: employee.createdAt?.toISOString() || '',
      updatedAt: employee.updatedAt?.toISOString() || '',
      // Note: emailVerified is from _User, not Employees. For accurate status,
      // you would need to query the _User class using the email or link the objects.
      // For now, it's not included directly from Employees.
    }));
  } catch (error) {
    console.error("❌ Error fetching employees:", error);
    throw new Error(`Failed to fetch employees: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a new user in both the _User class and the Employees class.
 * The _User emailVerified status will be set to true on creation.
 * @param userData The data for the new user.
 * @returns A promise that resolves to the created Employee object.
 */
export async function createUser(userData: CreateUserData): Promise<Employee> {
  const { username, email, password, Acess_level } = userData;
  const parseUser = new Parse.User();
  const Employee = Parse.Object.extend('Employees');
  const employeeRecord = new Employee();

  // Create in _User class for authentication
  parseUser.set('username', username);
  parseUser.set('email', email);
  parseUser.set('password', password);
  parseUser.set('Acess_level', Acess_level || 'User'); // Default to 'User' in _User class
  parseUser.set('emailVerified', true); // Set emailVerified to true upon creation

  // Create in Employees class as a mirror
  employeeRecord.set('User', username);
  employeeRecord.set('Email', email);
  employeeRecord.set('Access_level', Acess_level || 'User'); // Default to 'User' in Employees class

  try {
    const newParseUser = await parseUser.signUp();
    const newEmployeeRecord = await employeeRecord.save();

    console.log("✅ User created in _User class:", newParseUser.id);
    console.log("✅ Record created in Employees class:", newEmployeeRecord.id);

    return {
      objectId: newEmployeeRecord.id, // Return the objectId from Employees
      User: newEmployeeRecord.get('User'),
      Email: newEmployeeRecord.get('Email'),
      Access_level: newEmployeeRecord.get('Access_level'),
      createdAt: newEmployeeRecord.createdAt?.toISOString() || '',
      updatedAt: newEmployeeRecord.updatedAt?.toISOString() || '',
    };
  } catch (error) {
    // If one fails, try to clean up the other if it succeeded
    console.error('Error creating user/employee record:', error);
    // You might want to add more robust rollback logic here
    throw new Error(`Failed to create user and employee record: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Updates an existing user in both the _User class and the Employees class.
 * It uses the email to find the corresponding _User object.
 * @param userData The data for the user to update, including objectId (from the Employee record).
 * @returns A promise that resolves to the updated Employee object.
 */
export async function updateUser(userData: UpdateUserData): Promise<Employee> {
  try {
    // 1. Find the Employee record by its objectId
    const employeeQueryById = new Parse.Query('Employees');
    const employeeRecordToUpdate = await employeeQueryById.get(userData.objectId);

    // 2. Find the corresponding _User record by email (assuming email is unique and consistent)
    const parseUserQueryByEmail = new Parse.Query(Parse.User);
    parseUserQueryByEmail.equalTo('email', employeeRecordToUpdate.get('Email'));
    const userToUpdate = await parseUserQueryByEmail.first();

    if (!userToUpdate) {
      throw new Error(`_User record not found for email: ${employeeRecordToUpdate.get('Email')}`);
    }

    // Update _User class
    if (userData.username !== undefined) userToUpdate.set('username', userData.username);
    if (userData.email !== undefined) userToUpdate.set('email', userData.email);
    if (userData.password !== undefined && userData.password !== "") userToUpdate.set('password', userData.password);
    if (userData.Acess_level !== undefined) userToUpdate.set('Acess_level', userData.Acess_level);
    // Always set emailVerified to true during update as per requirement
    userToUpdate.set('emailVerified', true);

    // Update Employees class
    if (userData.username !== undefined) employeeRecordToUpdate.set('User', userData.username);
    if (userData.email !== undefined) employeeRecordToUpdate.set('Email', userData.email);
    if (userData.Acess_level !== undefined) employeeRecordToUpdate.set('Access_level', userData.Acess_level);

    await userToUpdate.save();
    const updatedEmployeeRecord = await employeeRecordToUpdate.save();

    console.log("✅ User updated in _User class:", userToUpdate.id);
    console.log("✅ Record updated in Employees class:", updatedEmployeeRecord.id);

    return {
      objectId: updatedEmployeeRecord.id,
      User: updatedEmployeeRecord.get('User'),
      Email: updatedEmployeeRecord.get('Email'),
      Access_level: updatedEmployeeRecord.get('Access_level'),
      createdAt: updatedEmployeeRecord.createdAt?.toISOString() || '',
      updatedAt: updatedEmployeeRecord.updatedAt?.toISOString() || '',
    };
  } catch (error) {
    console.error('Error updating user/employee record:', error);
    throw new Error(`Failed to update user and employee record: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes a user from both the _User class and the Employees class.
 * It uses the objectId of the Employee record to find both entries.
 * @param employeeObjectId The objectId of the Employee record to delete.
 * @returns A promise that resolves when both records are deleted.
 */
export async function deleteUser(employeeObjectId: string): Promise<void> {
  try {
    // 1. Find the Employee record by its objectId
    const employeeQueryById = new Parse.Query('Employees');
    const employeeRecordToDelete = await employeeQueryById.get(employeeObjectId);

    // 2. Use the email from the Employee record to find the corresponding _User record
    const parseUserQueryByEmail = new Parse.Query(Parse.User);
    parseUserQueryByEmail.equalTo('email', employeeRecordToDelete.get('Email'));
    const userToDelete = await parseUserQueryByEmail.first();

    // Delete Employee record first for atomicity (if _User delete fails, Employee is still gone)
    await employeeRecordToDelete.destroy();
    console.log("✅ Record deleted from Employees class:", employeeObjectId);

    if (userToDelete) {
      await userToDelete.destroy();
      console.log("✅ User deleted from _User class:", userToDelete.id);
    } else {
      console.warn(`No matching _User record found for Employee email ${employeeRecordToDelete.get('Email')}.`);
    }
  } catch (error) {
    console.error('Error deleting user/employee record:', error);
    throw new Error(`Failed to delete user and employee record: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Sends a simulated broadcast notification.
 * @param notificationData The notification content.
 * @returns A promise that resolves when the notification is "sent".
 */
export async function sendBroadcastNotification(notificationData: NotificationData): Promise<void> {
  console.log('Simulating broadcast notification:', notificationData);
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
 * Fetches and calculates user statistics from the "Employees" class.
 * @returns A promise that resolves to an object containing user statistics.
 */
export async function getUserStatistics() {
  try {
    const query = new Parse.Query('Employees');
    query.contains('Email', '@inventure.mu'); // Only count users with @inventure.mu email

    const totalUsers = await query.count();

    // For "Verified Users", we are now counting all users with @inventure.mu email,
    // as per your requirement to treat them as verified if no specific field is in Employees.
    const verifiedUsersQuery = new Parse.Query('Employees');
    verifiedUsersQuery.contains('Email', '@inventure.mu');
    const verifiedUsers = await verifiedUsersQuery.count();

    const adminUsersQuery = new Parse.Query('Employees');
    adminUsersQuery.contains('Email', '@inventure.mu'); // Ensure it's for inventure.mu
    adminUsersQuery.equalTo('Access_level', 'Admin'); // Case-sensitive based on your schema data
    const adminUsers = await adminUsersQuery.count();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsersQuery = new Parse.Query('Employees');
    recentUsersQuery.contains('Email', '@inventure.mu');
    recentUsersQuery.greaterThanOrEqualTo('createdAt', sevenDaysAgo);
    const recentUsers = await recentUsersQuery.count();

    return {
      totalUsers,
      verifiedUsers, // This will be the same as totalUsers if all @inventure.mu are considered verified
      adminUsers,
      recentUsers,
    };
  } catch (error) {
    console.error('Error getting employee statistics:', error);
    throw new Error(`Failed to get employee statistics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

