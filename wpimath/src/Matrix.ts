import { Nat, NatNum } from './Nat';
import { Num } from './Num';
import { SimpleMatrix } from './util/SimpleMatrix';

/**
 * A shape-safe wrapper over matrices.
 *
 * <p>This class is intended to be used alongside the state space library.
 *
 * @param R The number of rows in this matrix.
 * @param C The number of columns in this matrix.
 */
export class Matrix<R extends Num, C extends Num> {
  /** Storage for underlying matrix. */
  protected readonly m_storage: SimpleMatrix;

  /**
   * Constructs an empty matrix of the given dimensions.
   *
   * @param rows The number of rows of the matrix.
   * @param columns The number of columns of the matrix.
   */
  constructor(rows: NatNum<R>, columns: NatNum<C>);

  /**
   * Constructs a matrix with the given dimensions and contents.
   *
   * @param rows The number of rows of the matrix.
   * @param columns The number of columns of the matrix.
   * @param data The data to fill this matrix with.
   */
  constructor(rows: NatNum<R>, columns: NatNum<C>, data: number[]);

  /**
   * Constructs a matrix with the given dimensions.
   *
   * @param rows The number of rows of the matrix.
   * @param columns The number of columns of the matrix.
   * @param data The data to fill this matrix with (optional).
   */
  constructor(rows: NatNum<R> | number, columns: NatNum<C> | number, data?: number[]) {
    const rowsNum = typeof rows === 'number' ? rows : rows.getNum();
    const colsNum = typeof columns === 'number' ? columns : columns.getNum();

    if (data) {
      this.m_storage = new SimpleMatrix(rowsNum, colsNum);
      for (let i = 0; i < rowsNum; i++) {
        for (let j = 0; j < colsNum; j++) {
          this.m_storage.set(i, j, data[i * colsNum + j]);
        }
      }
    } else {
      this.m_storage = new SimpleMatrix(rowsNum, colsNum);
    }
  }

  /**
   * Creates a matrix from the given SimpleMatrix.
   *
   * @param storage The SimpleMatrix to create this matrix from.
   * @return The created matrix.
   */
  public static fromSimpleMatrix<R extends Num, C extends Num>(
    storage: SimpleMatrix
  ): Matrix<R, C> {
    const matrix = new Matrix<R, C>(storage.getNumRows() as unknown as NatNum<R>, storage.getNumCols() as unknown as NatNum<C>);
    matrix.m_storage.copyFrom(storage);
    return matrix;
  }

  /**
   * Creates a matrix from the given data.
   *
   * @param rows The number of rows in the matrix.
   * @param columns The number of columns in the matrix.
   * @param data The data for the matrix.
   * @return The created matrix.
   */
  public static mat<R extends Num, C extends Num>(
    rows: NatNum<R>,
    columns: NatNum<C>
  ): Matrix<R, C> {
    return new Matrix<R, C>(rows, columns);
  }

  /**
   * Fill a matrix with the given data.
   *
   * @param rows The number of rows in the matrix.
   * @param columns The number of columns in the matrix.
   * @param data The data for the matrix.
   * @return The created matrix.
   */
  public fill(...data: number[]): Matrix<R, C> {
    const rows = this.getNumRows();
    const cols = this.getNumCols();

    if (data.length !== rows * cols) {
      throw new Error(`Expected ${rows * cols} elements, but got ${data.length}`);
    }

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        this.m_storage.set(i, j, data[i * cols + j]);
      }
    }

    return this;
  }

  /**
   * Returns the number of rows in this matrix.
   *
   * @return The number of rows in this matrix.
   */
  public getNumRows(): number {
    return this.m_storage.getNumRows();
  }

  /**
   * Returns the number of columns in this matrix.
   *
   * @return The number of columns in this matrix.
   */
  public getNumCols(): number {
    return this.m_storage.getNumCols();
  }

  /**
   * Get an element of this matrix.
   *
   * @param row The row of the element.
   * @param col The column of the element.
   * @return The element at the given position.
   */
  public get(row: number, col: number): number {
    return this.m_storage.get(row, col);
  }

  /**
   * Set an element of this matrix.
   *
   * @param row The row of the element.
   * @param col The column of the element.
   * @param value The value to set the element to.
   */
  public set(row: number, col: number, value: number): void {
    this.m_storage.set(row, col, value);
  }

  /**
   * Returns a copy of this matrix.
   *
   * @return A copy of this matrix.
   */
  public copy(): Matrix<R, C> {
    const result = new Matrix<R, C>(this.getNumRows() as unknown as NatNum<R>, this.getNumCols() as unknown as NatNum<C>);
    result.m_storage.copyFrom(this.m_storage);
    return result;
  }

  /**
   * Compute the matrix exponential, e^(this*t).
   *
   * @return The matrix exponential of this matrix.
   */
  public exp(): Matrix<R, R> {
    if (this.getNumRows() !== this.getNumCols()) {
      throw new Error("Matrix exponential only works on square matrices");
    }

    // Simple implementation using Taylor series
    // e^A = I + A + A^2/2! + A^3/3! + ...
    const n = this.getNumRows();
    const result = new Matrix<R, R>(n as unknown as NatNum<R>, n as unknown as NatNum<R>);

    // Initialize with identity matrix
    for (let i = 0; i < n; i++) {
      result.set(i, i, 1);
    }

    // Compute Taylor series
    let term = this.copy() as Matrix<R, R>;
    let factorial = 1;

    for (let i = 1; i <= 10; i++) { // Use 10 terms for approximation
      // Add term/i! to result
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          result.set(row, col, result.get(row, col) + term.get(row, col) / factorial);
        }
      }

      // Compute next term: term = term * this
      term = term.times(this) as Matrix<R, R>;
      factorial *= (i + 1);
    }

    return result;
  }

  /**
   * Returns the transpose of this matrix.
   *
   * @return The transpose of this matrix.
   */
  public transpose(): Matrix<C, R> {
    const result = new Matrix<C, R>(this.getNumCols() as unknown as NatNum<C>, this.getNumRows() as unknown as NatNum<R>);

    for (let i = 0; i < this.getNumRows(); i++) {
      for (let j = 0; j < this.getNumCols(); j++) {
        result.set(j, i, this.get(i, j));
      }
    }

    return result;
  }

  /**
   * Returns the sum of this matrix and another matrix.
   *
   * @param other The other matrix.
   * @return The sum of this matrix and the other matrix.
   */
  public plus(other: Matrix<R, C>): Matrix<R, C> {
    if (this.getNumRows() !== other.getNumRows() || this.getNumCols() !== other.getNumCols()) {
      throw new Error("Matrix dimensions do not match for addition");
    }

    const result = new Matrix<R, C>(this.getNumRows() as unknown as NatNum<R>, this.getNumCols() as unknown as NatNum<C>);

    for (let i = 0; i < this.getNumRows(); i++) {
      for (let j = 0; j < this.getNumCols(); j++) {
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
  public minus(other: Matrix<R, C>): Matrix<R, C> {
    if (this.getNumRows() !== other.getNumRows() || this.getNumCols() !== other.getNumCols()) {
      throw new Error("Matrix dimensions do not match for subtraction");
    }

    const result = new Matrix<R, C>(this.getNumRows() as unknown as NatNum<R>, this.getNumCols() as unknown as NatNum<C>);

    for (let i = 0; i < this.getNumRows(); i++) {
      for (let j = 0; j < this.getNumCols(); j++) {
        result.set(i, j, this.get(i, j) - other.get(i, j));
      }
    }

    return result;
  }

  /**
   * Returns the product of this matrix and another matrix or scalar.
   *
   * @param value The other matrix or scalar.
   * @return The product of this matrix and the other matrix or scalar.
   */
  public times<C2 extends Num>(value: Matrix<C, C2> | number): Matrix<R, C2> | Matrix<R, C> {
    if (typeof value === 'number') {
      const scalar = value;
      const result = new Matrix<R, C>(this.getNumRows() as unknown as NatNum<R>, this.getNumCols() as unknown as NatNum<C>);

      for (let i = 0; i < this.getNumRows(); i++) {
        for (let j = 0; j < this.getNumCols(); j++) {
          result.set(i, j, this.get(i, j) * scalar);
        }
      }

      return result;
    } else {
      const other = value;
      if (this.getNumCols() !== other.getNumRows()) {
        throw new Error("Matrix dimensions do not match for multiplication");
      }

      const result = new Matrix<R, C2>(this.getNumRows() as unknown as NatNum<R>, other.getNumCols() as unknown as NatNum<C2>);

      for (let i = 0; i < this.getNumRows(); i++) {
        for (let j = 0; j < other.getNumCols(); j++) {
          let sum = 0;
          for (let k = 0; k < this.getNumCols(); k++) {
            sum += this.get(i, k) * other.get(k, j);
          }
          result.set(i, j, sum);
        }
      }

      return result;
    }
  }

  /**
   * Returns the quotient of this matrix and a scalar.
   *
   * @param scalar The scalar to divide by.
   * @return The quotient of this matrix and the scalar.
   */
  public div(scalar: number): Matrix<R, C> {
    if (scalar === 0) {
      throw new Error("Division by zero");
    }

    const result = new Matrix<R, C>(this.getNumRows() as unknown as NatNum<R>, this.getNumCols() as unknown as NatNum<C>);

    for (let i = 0; i < this.getNumRows(); i++) {
      for (let j = 0; j < this.getNumCols(); j++) {
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

    for (let i = 0; i < this.getNumRows(); i++) {
      for (let j = 0; j < this.getNumCols(); j++) {
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
  public isEqual(other: Matrix<R, C>, tolerance: number = 1e-9): boolean {
    if (this.getNumRows() !== other.getNumRows() || this.getNumCols() !== other.getNumCols()) {
      return false;
    }

    for (let i = 0; i < this.getNumRows(); i++) {
      for (let j = 0; j < this.getNumCols(); j++) {
        if (Math.abs(this.get(i, j) - other.get(i, j)) > tolerance) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Returns a block of this matrix.
   *
   * @param rowStart The start row of the block.
   * @param colStart The start column of the block.
   * @param rowSize The number of rows in the block.
   * @param colSize The number of columns in the block.
   * @return The block of this matrix.
   */
  public block<R2 extends Num, C2 extends Num>(
    rowStart: number,
    colStart: number,
    rowSize: number,
    colSize: number
  ): Matrix<R2, C2> {
    if (rowStart < 0 || colStart < 0 || rowStart + rowSize > this.getNumRows() || colStart + colSize > this.getNumCols()) {
      throw new Error("Block indices out of bounds");
    }

    const result = new Matrix<R2, C2>(rowSize as unknown as NatNum<R2>, colSize as unknown as NatNum<C2>);

    for (let i = 0; i < rowSize; i++) {
      for (let j = 0; j < colSize; j++) {
        result.set(i, j, this.get(rowStart + i, colStart + j));
      }
    }

    return result;
  }

  /**
   * Assigns a block of this matrix from another matrix.
   *
   * @param rowStart The start row of the block.
   * @param colStart The start column of the block.
   * @param other The matrix to assign from.
   */
  public assignBlock<R2 extends Num, C2 extends Num>(
    rowStart: number,
    colStart: number,
    other: Matrix<R2, C2>
  ): void {
    if (rowStart < 0 || colStart < 0 || rowStart + other.getNumRows() > this.getNumRows() || colStart + other.getNumCols() > this.getNumCols()) {
      throw new Error("Block indices out of bounds");
    }

    for (let i = 0; i < other.getNumRows(); i++) {
      for (let j = 0; j < other.getNumCols(); j++) {
        this.set(rowStart + i, colStart + j, other.get(i, j));
      }
    }
  }

  /**
   * Extracts a block from another matrix into this matrix.
   *
   * @param rowStart The start row of the block.
   * @param colStart The start column of the block.
   * @param other The matrix to extract from.
   */
  public extractFrom<R2 extends Num, C2 extends Num>(
    rowStart: number,
    colStart: number,
    other: Matrix<R2, C2>
  ): void {
    if (rowStart < 0 || colStart < 0 || rowStart + this.getNumRows() > other.getNumRows() || colStart + this.getNumCols() > other.getNumCols()) {
      throw new Error("Block indices out of bounds");
    }

    for (let i = 0; i < this.getNumRows(); i++) {
      for (let j = 0; j < this.getNumCols(); j++) {
        this.set(i, j, other.get(rowStart + i, colStart + j));
      }
    }
  }

  /**
   * Solves the linear system Ax = b, where A is this matrix and b is the right-hand side.
   *
   * @param rhs The right-hand side of the linear system.
   * @return The solution to the linear system.
   */
  public solve<C2 extends Num>(rhs: Matrix<R, C2>): Matrix<C, C2> {
    if (this.getNumRows() !== this.getNumCols()) {
      throw new Error("Matrix must be square for solving linear systems");
    }

    if (this.getNumRows() !== rhs.getNumRows()) {
      throw new Error("Matrix dimensions do not match for solving linear systems");
    }

    // Simple implementation using Gaussian elimination
    const n = this.getNumRows();
    const m = rhs.getNumCols();

    // Create augmented matrix [A|b]
    const augmented = new SimpleMatrix(n, n + m);

    // Copy A into augmented
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        augmented.set(i, j, this.get(i, j));
      }
    }

    // Copy b into augmented
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        augmented.set(i, n + j, rhs.get(i, j));
      }
    }

    // Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      let maxVal = Math.abs(augmented.get(i, i));

      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(augmented.get(j, i));
        if (val > maxVal) {
          maxVal = val;
          maxRow = j;
        }
      }

      // Swap rows
      if (maxRow !== i) {
        for (let j = i; j < n + m; j++) {
          const temp = augmented.get(i, j);
          augmented.set(i, j, augmented.get(maxRow, j));
          augmented.set(maxRow, j, temp);
        }
      }

      // Check for singularity
      if (Math.abs(augmented.get(i, i)) < 1e-10) {
        throw new Error("Matrix is singular");
      }

      // Eliminate below
      for (let j = i + 1; j < n; j++) {
        const factor = augmented.get(j, i) / augmented.get(i, i);

        for (let k = i; k < n + m; k++) {
          augmented.set(j, k, augmented.get(j, k) - factor * augmented.get(i, k));
        }
      }
    }

    // Back substitution
    const result = new Matrix<C, C2>(n as unknown as NatNum<C>, m as unknown as NatNum<C2>);

    for (let i = n - 1; i >= 0; i--) {
      for (let j = 0; j < m; j++) {
        let sum = augmented.get(i, n + j);

        for (let k = i + 1; k < n; k++) {
          sum -= augmented.get(i, k) * result.get(k, j);
        }

        result.set(i, j, sum / augmented.get(i, i));
      }
    }

    return result;
  }

  /**
   * Returns the data of this matrix as a flat array.
   *
   * @return The data of this matrix as a flat array.
   */
  public getData(): number[] {
    const data: number[] = [];

    for (let i = 0; i < this.getNumRows(); i++) {
      for (let j = 0; j < this.getNumCols(); j++) {
        data.push(this.get(i, j));
      }
    }

    return data;
  }

  /**
   * Returns a string representation of this matrix.
   *
   * @return A string representation of this matrix.
   */
  public toString(): string {
    let result = "";

    for (let i = 0; i < this.getNumRows(); i++) {
      result += "[ ";

      for (let j = 0; j < this.getNumCols(); j++) {
        result += this.get(i, j).toFixed(6);

        if (j < this.getNumCols() - 1) {
          result += ", ";
        }
      }

      result += " ]";

      if (i < this.getNumRows() - 1) {
        result += "\n";
      }
    }

    return result;
  }
}
