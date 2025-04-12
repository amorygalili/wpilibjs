/**
 * A simple matrix class for use in simulation
 */
export class Matrix {
  private data: number[][];
  
  /**
   * Create a new matrix with the given dimensions
   * 
   * @param rows Number of rows
   * @param cols Number of columns
   * @param initialValue Initial value for all elements (default: 0)
   */
  constructor(private rows: number, private cols: number, initialValue: number = 0) {
    this.data = new Array(rows);
    for (let i = 0; i < rows; i++) {
      this.data[i] = new Array(cols).fill(initialValue);
    }
  }
  
  /**
   * Create a new matrix from a 2D array
   * 
   * @param data 2D array of values
   * @returns A new matrix
   */
  static fromArray(data: number[][]): Matrix {
    const rows = data.length;
    const cols = data[0].length;
    const matrix = new Matrix(rows, cols);
    matrix.data = data.map(row => [...row]); // Deep copy
    return matrix;
  }
  
  /**
   * Create a new identity matrix
   * 
   * @param size Size of the matrix
   * @returns A new identity matrix
   */
  static identity(size: number): Matrix {
    const matrix = new Matrix(size, size);
    for (let i = 0; i < size; i++) {
      matrix.data[i][i] = 1;
    }
    return matrix;
  }
  
  /**
   * Get the number of rows
   * 
   * @returns Number of rows
   */
  getRows(): number {
    return this.rows;
  }
  
  /**
   * Get the number of columns
   * 
   * @returns Number of columns
   */
  getCols(): number {
    return this.cols;
  }
  
  /**
   * Get the value at the given position
   * 
   * @param row Row index
   * @param col Column index
   * @returns Value at the given position
   */
  get(row: number, col: number): number {
    return this.data[row][col];
  }
  
  /**
   * Set the value at the given position
   * 
   * @param row Row index
   * @param col Column index
   * @param value New value
   */
  set(row: number, col: number, value: number): void {
    this.data[row][col] = value;
  }
  
  /**
   * Add another matrix to this one
   * 
   * @param other Matrix to add
   * @returns A new matrix with the result
   */
  add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions do not match for addition');
    }
    
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] + other.data[i][j];
      }
    }
    
    return result;
  }
  
  /**
   * Subtract another matrix from this one
   * 
   * @param other Matrix to subtract
   * @returns A new matrix with the result
   */
  subtract(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions do not match for subtraction');
    }
    
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] - other.data[i][j];
      }
    }
    
    return result;
  }
  
  /**
   * Multiply this matrix by another matrix
   * 
   * @param other Matrix to multiply by
   * @returns A new matrix with the result
   */
  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error('Matrix dimensions do not match for multiplication');
    }
    
    const result = new Matrix(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.data[i][k] * other.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    
    return result;
  }
  
  /**
   * Multiply this matrix by a scalar
   * 
   * @param scalar Scalar to multiply by
   * @returns A new matrix with the result
   */
  scale(scalar: number): Matrix {
    const result = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[i][j] = this.data[i][j] * scalar;
      }
    }
    
    return result;
  }
  
  /**
   * Transpose this matrix
   * 
   * @returns A new matrix with the result
   */
  transpose(): Matrix {
    const result = new Matrix(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[j][i] = this.data[i][j];
      }
    }
    
    return result;
  }
  
  /**
   * Get a submatrix of this matrix
   * 
   * @param startRow Starting row index
   * @param startCol Starting column index
   * @param endRow Ending row index (exclusive)
   * @param endCol Ending column index (exclusive)
   * @returns A new matrix with the result
   */
  submatrix(startRow: number, startCol: number, endRow: number, endCol: number): Matrix {
    if (startRow < 0 || startCol < 0 || endRow > this.rows || endCol > this.cols) {
      throw new Error('Submatrix indices out of bounds');
    }
    
    const rows = endRow - startRow;
    const cols = endCol - startCol;
    const result = new Matrix(rows, cols);
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result.data[i][j] = this.data[startRow + i][startCol + j];
      }
    }
    
    return result;
  }
  
  /**
   * Calculate the determinant of this matrix
   * 
   * @returns The determinant
   */
  determinant(): number {
    if (this.rows !== this.cols) {
      throw new Error('Matrix must be square to calculate determinant');
    }
    
    if (this.rows === 1) {
      return this.data[0][0];
    }
    
    if (this.rows === 2) {
      return this.data[0][0] * this.data[1][1] - this.data[0][1] * this.data[1][0];
    }
    
    let det = 0;
    for (let j = 0; j < this.cols; j++) {
      const minor = this.minor(0, j);
      const cofactor = this.data[0][j] * Math.pow(-1, j);
      det += cofactor * minor.determinant();
    }
    
    return det;
  }
  
  /**
   * Calculate the minor of this matrix
   * 
   * @param row Row to exclude
   * @param col Column to exclude
   * @returns A new matrix with the result
   */
  minor(row: number, col: number): Matrix {
    const result = new Matrix(this.rows - 1, this.cols - 1);
    let r = 0;
    
    for (let i = 0; i < this.rows; i++) {
      if (i === row) continue;
      
      let c = 0;
      for (let j = 0; j < this.cols; j++) {
        if (j === col) continue;
        
        result.data[r][c] = this.data[i][j];
        c++;
      }
      
      r++;
    }
    
    return result;
  }
  
  /**
   * Calculate the inverse of this matrix
   * 
   * @returns A new matrix with the result
   */
  inverse(): Matrix {
    if (this.rows !== this.cols) {
      throw new Error('Matrix must be square to calculate inverse');
    }
    
    const det = this.determinant();
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is singular, cannot calculate inverse');
    }
    
    if (this.rows === 1) {
      const result = new Matrix(1, 1);
      result.data[0][0] = 1 / this.data[0][0];
      return result;
    }
    
    if (this.rows === 2) {
      const result = new Matrix(2, 2);
      result.data[0][0] = this.data[1][1] / det;
      result.data[0][1] = -this.data[0][1] / det;
      result.data[1][0] = -this.data[1][0] / det;
      result.data[1][1] = this.data[0][0] / det;
      return result;
    }
    
    const cofactors = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const minor = this.minor(i, j);
        cofactors.data[i][j] = Math.pow(-1, i + j) * minor.determinant();
      }
    }
    
    return cofactors.transpose().scale(1 / det);
  }
  
  /**
   * Convert this matrix to a string
   * 
   * @returns String representation of this matrix
   */
  toString(): string {
    let result = '';
    for (let i = 0; i < this.rows; i++) {
      result += '[ ';
      for (let j = 0; j < this.cols; j++) {
        result += this.data[i][j].toFixed(4);
        if (j < this.cols - 1) {
          result += ', ';
        }
      }
      result += ' ]';
      if (i < this.rows - 1) {
        result += '\n';
      }
    }
    return result;
  }
}
