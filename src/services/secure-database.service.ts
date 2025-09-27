import { Sequelize, QueryTypes, Op } from 'sequelize';
import validator from 'validator';
import { logger } from '../utils/logger';

/**
 * Secure Database Service
 * Prevents SQL injection attacks through:
 * 1. Parameterized queries
 * 2. Input validation
 * 3. Query whitelisting
 * 4. Audit logging
 */
export class SecureDatabaseService {
  private static readonly ALLOWED_TABLES = ['users', 'content', 'websites', 'ai_tracking_results'];
  private static readonly FIELD_WHITELIST = new Map([
    ['users', ['id', 'email', 'name', 'created_at', 'updated_at', 'organization_id', 'role']],
    ['content', ['id', 'title', 'body', 'status', 'website_id', 'created_at', 'updated_at']],
    ['websites', ['id', 'url', 'name', 'user_id', 'created_at', 'updated_at']],
    ['ai_tracking_results', ['id', 'website_id', 'data', 'created_at']]
  ]);

  /**
   * Validate input based on type
   */
  static validateInput(input: string, type: 'email' | 'uuid' | 'alphanumeric' | 'url' | 'number'): boolean {
    if (!input) return false;

    switch(type) {
      case 'email':
        return validator.isEmail(input);
      case 'uuid':
        return validator.isUUID(input);
      case 'alphanumeric':
        return validator.isAlphanumeric(input);
      case 'url':
        return validator.isURL(input);
      case 'number':
        return validator.isNumeric(input);
      default:
        return false;
    }
  }

  /**
   * Sanitize string input to prevent XSS and SQL injection
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';

    // Remove SQL keywords and dangerous characters
    const dangerousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|SCRIPT)\b)/gi,
      /[;'"\\]/g
    ];

    let sanitized = input;
    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Escape HTML entities
    sanitized = validator.escape(sanitized);

    return sanitized.trim();
  }

  /**
   * Execute parameterized query safely
   */
  static async executeQuery<T>(
    sequelize: Sequelize,
    query: string,
    replacements: any = {},
    type: QueryTypes = QueryTypes.SELECT
  ): Promise<T> {
    try {
      // Log query for audit (without sensitive data)
      this.auditQuery(query, Object.keys(replacements));

      // Execute parameterized query
      const result = await sequelize.query(query, {
        replacements,
        type,
        raw: true,
        logging: false // We handle logging separately
      });

      return result as T;
    } catch (error) {
      logger.error('Database query error:', error);
      throw new Error('Database operation failed');
    }
  }

  /**
   * Get user by email with validation
   */
  static async getUserByEmail(sequelize: Sequelize, email: string): Promise<any> {
    // Validate email format
    if (!this.validateInput(email, 'email')) {
      throw new Error('Invalid email format');
    }

    const query = `
      SELECT id, email, name, role, organization_id, created_at
      FROM users
      WHERE email = :email
      AND deleted_at IS NULL
      LIMIT 1
    `;

    const results = await this.executeQuery<any[]>(
      sequelize,
      query,
      { email: email.toLowerCase() },
      QueryTypes.SELECT
    );

    return results[0] || null;
  }

  /**
   * Get content by ID with validation
   */
  static async getContentById(sequelize: Sequelize, contentId: string): Promise<any> {
    // Validate UUID format
    if (!this.validateInput(contentId, 'uuid')) {
      throw new Error('Invalid content ID format');
    }

    const query = `
      SELECT c.*, w.url as website_url, w.name as website_name
      FROM content c
      LEFT JOIN websites w ON c.website_id = w.id
      WHERE c.id = :contentId
      AND c.deleted_at IS NULL
      LIMIT 1
    `;

    const results = await this.executeQuery<any[]>(
      sequelize,
      query,
      { contentId },
      QueryTypes.SELECT
    );

    return results[0] || null;
  }

  /**
   * Search content with safe LIKE queries
   */
  static async searchContent(
    sequelize: Sequelize,
    searchTerm: string,
    websiteId?: string
  ): Promise<any[]> {
    // Sanitize search term
    const sanitized = this.sanitizeInput(searchTerm);
    if (!sanitized || sanitized.length < 3) {
      throw new Error('Search term must be at least 3 characters');
    }

    let query = `
      SELECT c.*, w.url as website_url
      FROM content c
      LEFT JOIN websites w ON c.website_id = w.id
      WHERE c.deleted_at IS NULL
      AND (
        c.title LIKE :searchPattern
        OR c.body LIKE :searchPattern
      )
    `;

    const replacements: any = {
      searchPattern: `%${sanitized}%`
    };

    if (websiteId) {
      if (!this.validateInput(websiteId, 'uuid')) {
        throw new Error('Invalid website ID format');
      }
      query += ' AND c.website_id = :websiteId';
      replacements.websiteId = websiteId;
    }

    query += ' ORDER BY c.created_at DESC LIMIT 100';

    return this.executeQuery<any[]>(
      sequelize,
      query,
      replacements,
      QueryTypes.SELECT
    );
  }

  /**
   * Insert data safely
   */
  static async insertRecord(
    sequelize: Sequelize,
    table: string,
    data: Record<string, any>
  ): Promise<string> {
    // Validate table name
    if (!this.ALLOWED_TABLES.includes(table)) {
      throw new Error('Invalid table name');
    }

    // Validate fields
    const allowedFields = this.FIELD_WHITELIST.get(table);
    if (!allowedFields) {
      throw new Error('Table not configured');
    }

    const fields = Object.keys(data).filter(field =>
      allowedFields.includes(field) || field === 'id'
    );

    if (fields.length === 0) {
      throw new Error('No valid fields provided');
    }

    // Build parameterized INSERT query
    const fieldNames = fields.join(', ');
    const fieldPlaceholders = fields.map(f => `:${f}`).join(', ');

    const query = `
      INSERT INTO ${table} (${fieldNames})
      VALUES (${fieldPlaceholders})
    `;

    // Sanitize string values
    const sanitizedData: Record<string, any> = {};
    for (const field of fields) {
      if (typeof data[field] === 'string') {
        sanitizedData[field] = this.sanitizeInput(data[field]);
      } else {
        sanitizedData[field] = data[field];
      }
    }

    await this.executeQuery(
      sequelize,
      query,
      sanitizedData,
      QueryTypes.INSERT
    );

    return sanitizedData.id || 'success';
  }

  /**
   * Update record safely
   */
  static async updateRecord(
    sequelize: Sequelize,
    table: string,
    id: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    // Validate table
    if (!this.ALLOWED_TABLES.includes(table)) {
      throw new Error('Invalid table name');
    }

    // Validate ID
    if (!this.validateInput(id, 'uuid')) {
      throw new Error('Invalid ID format');
    }

    // Validate fields
    const allowedFields = this.FIELD_WHITELIST.get(table);
    if (!allowedFields) {
      throw new Error('Table not configured');
    }

    const fields = Object.keys(updates).filter(field =>
      allowedFields.includes(field) && field !== 'id'
    );

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Build SET clause
    const setClauses = fields.map(f => `${f} = :${f}`).join(', ');

    const query = `
      UPDATE ${table}
      SET ${setClauses}, updated_at = NOW()
      WHERE id = :id
      AND deleted_at IS NULL
    `;

    // Sanitize values
    const sanitizedUpdates: Record<string, any> = { id };
    for (const field of fields) {
      if (typeof updates[field] === 'string') {
        sanitizedUpdates[field] = this.sanitizeInput(updates[field]);
      } else {
        sanitizedUpdates[field] = updates[field];
      }
    }

    const [, affectedRows] = await this.executeQuery<[any, number]>(
      sequelize,
      query,
      sanitizedUpdates,
      QueryTypes.UPDATE
    );

    return affectedRows > 0;
  }

  /**
   * Delete record safely (soft delete)
   */
  static async deleteRecord(
    sequelize: Sequelize,
    table: string,
    id: string
  ): Promise<boolean> {
    // Validate table
    if (!this.ALLOWED_TABLES.includes(table)) {
      throw new Error('Invalid table name');
    }

    // Validate ID
    if (!this.validateInput(id, 'uuid')) {
      throw new Error('Invalid ID format');
    }

    const query = `
      UPDATE ${table}
      SET deleted_at = NOW()
      WHERE id = :id
      AND deleted_at IS NULL
    `;

    const [, affectedRows] = await this.executeQuery<[any, number]>(
      sequelize,
      query,
      { id },
      QueryTypes.UPDATE
    );

    return affectedRows > 0;
  }

  /**
   * Get paginated results safely
   */
  static async getPaginatedResults(
    sequelize: Sequelize,
    table: string,
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at',
    orderDir: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    // Validate table
    if (!this.ALLOWED_TABLES.includes(table)) {
      throw new Error('Invalid table name');
    }

    // Validate pagination params
    page = Math.max(1, Math.min(page, 1000));
    limit = Math.max(1, Math.min(limit, 100));

    // Validate orderBy field
    const allowedFields = this.FIELD_WHITELIST.get(table);
    if (!allowedFields || !allowedFields.includes(orderBy)) {
      orderBy = 'created_at';
    }

    // Validate order direction
    if (!['ASC', 'DESC'].includes(orderDir)) {
      orderDir = 'DESC';
    }

    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${table}
      WHERE deleted_at IS NULL
    `;

    const [countResult] = await this.executeQuery<any[]>(
      sequelize,
      countQuery,
      {},
      QueryTypes.SELECT
    );

    const total = countResult?.total || 0;

    // Get paginated data
    const dataQuery = `
      SELECT *
      FROM ${table}
      WHERE deleted_at IS NULL
      ORDER BY ${orderBy} ${orderDir}
      LIMIT :limit
      OFFSET :offset
    `;

    const data = await this.executeQuery<any[]>(
      sequelize,
      dataQuery,
      { limit, offset },
      QueryTypes.SELECT
    );

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Audit query for security monitoring
   */
  private static auditQuery(query: string, params: string[]): void {
    // Remove sensitive data from query before logging
    const sanitizedQuery = query.replace(/:\w+/g, '?');

    logger.info('Database query audit', {
      query: sanitizedQuery,
      paramCount: params.length,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n')[3] // Get caller location
    });
  }

  /**
   * Prevent NoSQL injection for MongoDB/JSON operations
   */
  static sanitizeJsonQuery(query: any): any {
    if (typeof query !== 'object' || query === null) {
      return query;
    }

    const sanitized: any = {};

    for (const key in query) {
      // Block dangerous MongoDB operators
      if (key.startsWith('$')) {
        continue;
      }

      if (typeof query[key] === 'object') {
        sanitized[key] = this.sanitizeJsonQuery(query[key]);
      } else if (typeof query[key] === 'string') {
        sanitized[key] = this.sanitizeInput(query[key]);
      } else {
        sanitized[key] = query[key];
      }
    }

    return sanitized;
  }
}