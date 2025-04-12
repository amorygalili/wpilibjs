/**
 * A simple matrix class for handling basic matrix operations.
 */
export class SimpleMatrix {
  private m_data: number[][];
  private m_rows: number;
  private m_cols: number;

  /**
   * Constructs a new SimpleMatrix with the given dimensions.
   *
   * @param rows Number of rows.
   * @param cols Number of columns.
   */
  constructor(rows: number, cols: number) {
    this.m_rows = rows;
    this.m_cols = cols;
    this.m_data = new Array(rows);
    for (let i = 0; i < rows; i++) {
      this.m_data[i] = new Array(cols).fill(0);
    }
  }

  /**
   * Returns the number of rows in this matrix.
   *
   * @return The number of rows in this matrix.
   */
  public getNumRows(): number {
    return this.m_rows;
  }

  /**
   * Returns the number of columns in this matrix.
   *
   * @return The number of columns in this matrix.
   */
  public getNumCols(): number {
    return this.m_cols;
  }

  /**
   * Sets the value at the specified row and column.
   *
   * @param row The row index.
   * @param col The column index.
   * @param value The value to set.
   */
  public set(row: number, col: number, value: number): void {
    this.m_data[row][col] = value;
  }

  /**
   * Gets the value at the specified row and column.
   *
   * @param row The row index.
   * @param col The column index.
   * @return The value at the specified row and column.
   */
  public get(row: number, col: number): number {
    return this.m_data[row][col];
  }

  /**
   * Sets the values in a column.
   *
   * @param col The column index.
   * @param startRow The starting row index.
   * @param values The values to set.
   */
  public setColumn(col: number, startRow: number, ...values: number[]): void {
    for (let i = 0; i < values.length; i++) {
      this.m_data[startRow + i][col] = values[i];
    }
  }

  /**
   * Multiplies this matrix by another matrix.
   *
   * @param other The other matrix to multiply by.
   * @return The result of the multiplication.
   */
  public mult(other: SimpleMatrix): SimpleMatrix {
    if (this.m_cols !== other.m_rows) {
      throw new Error("Matrix dimensions do not match for multiplication");
    }

    const result = new SimpleMatrix(this.m_rows, other.m_cols);
    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < other.m_cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.m_cols; k++) {
          sum += this.m_data[i][k] * other.m_data[k][j];
        }
        result.m_data[i][j] = sum;
      }
    }
    return result;
  }

  /**
   * Computes the Moore-Penrose pseudoinverse of this matrix.
   * This is a simple implementation that works for the specific case of the mecanum drive kinematics.
   *
   * @return The pseudoinverse of this matrix.
   */
  public pseudoInverse(): SimpleMatrix {
    // For a matrix A, the pseudoinverse A+ can be computed as (A^T * A)^-1 * A^T
    const transpose = this.transpose();
    const ata = transpose.mult(this);

    // The matrix A^T * A should be a 3x3 matrix for mecanum drive kinematics
    if (ata.getNumRows() === 3 && ata.getNumCols() === 3) {
      const ataInv = this.inverse3x3(ata);
      return ataInv.mult(transpose);
    } else if (ata.getNumRows() === 2 && ata.getNumCols() === 2) {
      const ataInv = this.inverse2x2(ata);
      return ataInv.mult(transpose);
    } else {
      throw new Error("Matrix dimensions not supported for pseudoinverse");
    }
  }

  /**
   * Computes the transpose of this matrix.
   *
   * @return The transpose of this matrix.
   */
  public transpose(): SimpleMatrix {
    const result = new SimpleMatrix(this.m_cols, this.m_rows);
    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < this.m_cols; j++) {
        result.m_data[j][i] = this.m_data[i][j];
      }
    }
    return result;
  }

  /**
   * Computes the inverse of a 2x2 matrix.
   *
   * @param matrix The 2x2 matrix to invert.
   * @return The inverse of the matrix.
   */
  private inverse2x2(matrix: SimpleMatrix): SimpleMatrix {
    if (matrix.m_rows !== 2 || matrix.m_cols !== 2) {
      throw new Error("Matrix must be 2x2 for this inverse method");
    }

    const a = matrix.m_data[0][0];
    const b = matrix.m_data[0][1];
    const c = matrix.m_data[1][0];
    const d = matrix.m_data[1][1];

    const det = a * d - b * c;
    if (Math.abs(det) < 1e-9) {
      throw new Error("Matrix is singular and cannot be inverted");
    }

    const result = new SimpleMatrix(2, 2);
    result.m_data[0][0] = d / det;
    result.m_data[0][1] = -b / det;
    result.m_data[1][0] = -c / det;
    result.m_data[1][1] = a / det;

    return result;
  }

  /**
   * Computes the inverse of a 3x3 matrix.
   *
   * @param matrix The 3x3 matrix to invert.
   * @return The inverse of the matrix.
   */
  private inverse3x3(matrix: SimpleMatrix): SimpleMatrix {
    if (matrix.m_rows !== 3 || matrix.m_cols !== 3) {
      throw new Error("Matrix must be 3x3 for this inverse method");
    }

    const a = matrix.m_data[0][0];
    const b = matrix.m_data[0][1];
    const c = matrix.m_data[0][2];
    const d = matrix.m_data[1][0];
    const e = matrix.m_data[1][1];
    const f = matrix.m_data[1][2];
    const g = matrix.m_data[2][0];
    const h = matrix.m_data[2][1];
    const i = matrix.m_data[2][2];

    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    if (Math.abs(det) < 1e-9) {
      throw new Error("Matrix is singular and cannot be inverted");
    }

    const result = new SimpleMatrix(3, 3);
    result.m_data[0][0] = (e * i - f * h) / det;
    result.m_data[0][1] = (c * h - b * i) / det;
    result.m_data[0][2] = (b * f - c * e) / det;
    result.m_data[1][0] = (f * g - d * i) / det;
    result.m_data[1][1] = (a * i - c * g) / det;
    result.m_data[1][2] = (c * d - a * f) / det;
    result.m_data[2][0] = (d * h - e * g) / det;
    result.m_data[2][1] = (b * g - a * h) / det;
    result.m_data[2][2] = (a * e - b * d) / det;

    return result;
  }

  /**
   * Creates a copy of this matrix.
   *
   * @return A copy of this matrix.
   */
  public copy(): SimpleMatrix {
    const result = new SimpleMatrix(this.m_rows, this.m_cols);
    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < this.m_cols; j++) {
        result.m_data[i][j] = this.m_data[i][j];
      }
    }
    return result;
  }

  /**
   * Copy the contents of another matrix into this matrix.
   *
   * @param other The matrix to copy from.
   */
  public copyFrom(other: SimpleMatrix): void {
    if (this.m_rows !== other.m_rows || this.m_cols !== other.m_cols) {
      throw new Error("Matrix dimensions do not match for copying");
    }

    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < this.m_cols; j++) {
        this.m_data[i][j] = other.m_data[i][j];
      }
    }
  }

  /**
   * Returns the sum of this matrix and another matrix.
   *
   * @param other The other matrix.
   * @return The sum of this matrix and the other matrix.
   */
  public plus(other: SimpleMatrix): SimpleMatrix {
    if (this.m_rows !== other.m_rows || this.m_cols !== other.m_cols) {
      throw new Error("Matrix dimensions do not match for addition");
    }

    const result = new SimpleMatrix(this.m_rows, this.m_cols);

    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < this.m_cols; j++) {
        result.set(i, j, this.get(i, j) + other.get(i, j));
      }
    }

    return result;
  }

  /**
   * Returns the difference of this matrix and another matrix.
   *
   * @param other The other matrix.
   * @return The difference of this matrix and the other matrix.
   */
  public minus(other: SimpleMatrix): SimpleMatrix {
    if (this.m_rows !== other.m_rows || this.m_cols !== other.m_cols) {
      throw new Error("Matrix dimensions do not match for subtraction");
    }

    const result = new SimpleMatrix(this.m_rows, this.m_cols);

    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < this.m_cols; j++) {
        result.set(i, j, this.get(i, j) - other.get(i, j));
      }
    }

    return result;
  }

  /**
   * Returns the product of this matrix and a scalar or another matrix.
   *
   * @param value The scalar or matrix to multiply by.
   * @return The product of this matrix and the scalar or matrix.
   */
  public times(value: number | SimpleMatrix): SimpleMatrix {
    if (typeof value === 'number') {
      const scalar = value;
      const result = new SimpleMatrix(this.m_rows, this.m_cols);

      for (let i = 0; i < this.m_rows; i++) {
        for (let j = 0; j < this.m_cols; j++) {
          result.set(i, j, this.get(i, j) * scalar);
        }
      }

      return result;
    } else {
      return this.mult(value);
    }
  }

  /**
   * Returns the quotient of this matrix and a scalar.
   *
   * @param scalar The scalar to divide by.
   * @return The quotient of this matrix and the scalar.
   */
  public div(scalar: number): SimpleMatrix {
    if (scalar === 0) {
      throw new Error("Division by zero");
    }

    const result = new SimpleMatrix(this.m_rows, this.m_cols);

    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < this.m_cols; j++) {
        result.set(i, j, this.get(i, j) / scalar);
      }
    }

    return result;
  }

  /**
   * Returns the Frobenius norm of this matrix.
   *
   * @return The Frobenius norm of this matrix.
   */
  public normF(): number {
    let sum = 0;

    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < this.m_cols; j++) {
        sum += this.get(i, j) * this.get(i, j);
      }
    }

    return Math.sqrt(sum);
  }

  /**
   * Returns whether this matrix is equal to another matrix.
   *
   * @param other The other matrix.
   * @param tolerance The tolerance for the comparison.
   * @return Whether this matrix is equal to the other matrix.
   */
  public isEqual(other: SimpleMatrix, tolerance: number = 1e-9): boolean {
    if (this.m_rows !== other.m_rows || this.m_cols !== other.m_cols) {
      return false;
    }

    for (let i = 0; i < this.m_rows; i++) {
      for (let j = 0; j < this.m_cols; j++) {
        if (Math.abs(this.get(i, j) - other.get(i, j)) > tolerance) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Computes the matrix exponential, e^(this*t).
   * This is a simple implementation using Taylor series.
   *
   * @return The matrix exponential of this matrix.
   */
  public exp(): SimpleMatrix {
    if (this.m_rows !== this.m_cols) {
      throw new Error("Matrix exponential only works on square matrices");
    }

    // Simple implementation using Taylor series
    // e^A = I + A + A^2/2! + A^3/3! + ...
    const n = this.m_rows;
    const result = new SimpleMatrix(n, n);

    // Initialize with identity matrix
    for (let i = 0; i < n; i++) {
      result.set(i, i, 1);
    }

    // Compute Taylor series
    let term = this.copy();
    let factorial = 1;

    for (let i = 1; i <= 10; i++) { // Use 10 terms for approximation
      // Add term/i! to result
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          result.set(row, col, result.get(row, col) + term.get(row, col) / factorial);
        }
      }

      // Compute next term: term = term * this
      term = term.mult(this);
      factorial *= (i + 1);
    }

    return result;
  }
}
