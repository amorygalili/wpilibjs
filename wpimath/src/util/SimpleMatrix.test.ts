import { SimpleMatrix } from './SimpleMatrix';

describe('SimpleMatrix', () => {
  const kEpsilon = 1E-9;

  describe('constructors', () => {
    it('should create a matrix with the given dimensions', () => {
      const matrix = new SimpleMatrix(2, 3);
      expect(matrix.getNumRows()).toBe(2);
      expect(matrix.getNumCols()).toBe(3);
    });
  });

  describe('get and set', () => {
    it('should set and get values correctly', () => {
      const matrix = new SimpleMatrix(2, 2);
      matrix.set(0, 0, 1);
      matrix.set(0, 1, 2);
      matrix.set(1, 0, 3);
      matrix.set(1, 1, 4);

      expect(matrix.get(0, 0)).toBeCloseTo(1, 9);
      expect(matrix.get(0, 1)).toBeCloseTo(2, 9);
      expect(matrix.get(1, 0)).toBeCloseTo(3, 9);
      expect(matrix.get(1, 1)).toBeCloseTo(4, 9);
    });
  });

  describe('setColumn', () => {
    it('should set column values correctly', () => {
      const matrix = new SimpleMatrix(3, 2);
      matrix.setColumn(0, 0, 1, 2, 3);
      matrix.setColumn(1, 0, 4, 5, 6);

      expect(matrix.get(0, 0)).toBeCloseTo(1, 9);
      expect(matrix.get(1, 0)).toBeCloseTo(2, 9);
      expect(matrix.get(2, 0)).toBeCloseTo(3, 9);
      expect(matrix.get(0, 1)).toBeCloseTo(4, 9);
      expect(matrix.get(1, 1)).toBeCloseTo(5, 9);
      expect(matrix.get(2, 1)).toBeCloseTo(6, 9);
    });
  });

  describe('mult', () => {
    it('should multiply matrices correctly', () => {
      const a = new SimpleMatrix(2, 3);
      a.set(0, 0, 1);
      a.set(0, 1, 2);
      a.set(0, 2, 3);
      a.set(1, 0, 4);
      a.set(1, 1, 5);
      a.set(1, 2, 6);

      const b = new SimpleMatrix(3, 2);
      b.set(0, 0, 7);
      b.set(0, 1, 8);
      b.set(1, 0, 9);
      b.set(1, 1, 10);
      b.set(2, 0, 11);
      b.set(2, 1, 12);

      const c = a.mult(b);

      expect(c.getNumRows()).toBe(2);
      expect(c.getNumCols()).toBe(2);
      expect(c.get(0, 0)).toBeCloseTo(58, 9);
      expect(c.get(0, 1)).toBeCloseTo(64, 9);
      expect(c.get(1, 0)).toBeCloseTo(139, 9);
      expect(c.get(1, 1)).toBeCloseTo(154, 9);
    });

    it('should throw an error when dimensions do not match', () => {
      const a = new SimpleMatrix(2, 3);
      const b = new SimpleMatrix(2, 2);

      expect(() => a.mult(b)).toThrow();
    });
  });

  describe('transpose', () => {
    it('should transpose a matrix correctly', () => {
      const a = new SimpleMatrix(2, 3);
      a.set(0, 0, 1);
      a.set(0, 1, 2);
      a.set(0, 2, 3);
      a.set(1, 0, 4);
      a.set(1, 1, 5);
      a.set(1, 2, 6);

      const b = a.transpose();

      expect(b.getNumRows()).toBe(3);
      expect(b.getNumCols()).toBe(2);
      expect(b.get(0, 0)).toBeCloseTo(1, 9);
      expect(b.get(0, 1)).toBeCloseTo(4, 9);
      expect(b.get(1, 0)).toBeCloseTo(2, 9);
      expect(b.get(1, 1)).toBeCloseTo(5, 9);
      expect(b.get(2, 0)).toBeCloseTo(3, 9);
      expect(b.get(2, 1)).toBeCloseTo(6, 9);
    });
  });

  describe('inverse2x2', () => {
    it('should compute the inverse of a 2x2 matrix correctly', () => {
      const a = new SimpleMatrix(2, 2);
      a.set(0, 0, 4);
      a.set(0, 1, 7);
      a.set(1, 0, 2);
      a.set(1, 1, 6);

      // Call the private method through a workaround
      const inverse = (a as any).inverse2x2(a);

      expect(inverse.getNumRows()).toBe(2);
      expect(inverse.getNumCols()).toBe(2);

      // The determinant is 4*6 - 7*2 = 24 - 14 = 10
      expect(inverse.get(0, 0)).toBeCloseTo(6/10, 9);
      expect(inverse.get(0, 1)).toBeCloseTo(-7/10, 9);
      expect(inverse.get(1, 0)).toBeCloseTo(-2/10, 9);
      expect(inverse.get(1, 1)).toBeCloseTo(4/10, 9);

      // Check that A * A^-1 = I
      const identity = a.mult(inverse);
      expect(identity.get(0, 0)).toBeCloseTo(1, 9);
      expect(identity.get(0, 1)).toBeCloseTo(0, 9);
      expect(identity.get(1, 0)).toBeCloseTo(0, 9);
      expect(identity.get(1, 1)).toBeCloseTo(1, 9);
    });
  });

  describe('copy', () => {
    it('should create a deep copy of the matrix', () => {
      const a = new SimpleMatrix(2, 2);
      a.set(0, 0, 1);
      a.set(0, 1, 2);
      a.set(1, 0, 3);
      a.set(1, 1, 4);

      const b = a.copy();

      // Modify the original matrix
      a.set(0, 0, 5);

      // The copy should not be affected
      expect(b.get(0, 0)).toBeCloseTo(1, 9);
      expect(b.get(0, 1)).toBeCloseTo(2, 9);
      expect(b.get(1, 0)).toBeCloseTo(3, 9);
      expect(b.get(1, 1)).toBeCloseTo(4, 9);
    });
  });

  describe('pseudoInverse', () => {
    it('should compute the pseudoinverse of a matrix correctly', () => {
      // Create a 4x3 matrix (like the one used in MecanumDriveKinematics)
      const a = new SimpleMatrix(4, 3);
      // First row
      a.set(0, 0, 1);
      a.set(0, 1, 1);
      a.set(0, 2, -0.6);
      // Second row
      a.set(1, 0, 1);
      a.set(1, 1, -1);
      a.set(1, 2, -0.6);
      // Third row
      a.set(2, 0, 1);
      a.set(2, 1, -1);
      a.set(2, 2, 0.6);
      // Fourth row
      a.set(3, 0, 1);
      a.set(3, 1, 1);
      a.set(3, 2, 0.6);

      const pseudoInverse = a.pseudoInverse();

      // The pseudoinverse should be 3x4
      expect(pseudoInverse.getNumRows()).toBe(3);
      expect(pseudoInverse.getNumCols()).toBe(4);

      // Check that A * A+ * A ≈ A
      const result = a.mult(pseudoInverse).mult(a);

      for (let i = 0; i < a.getNumRows(); i++) {
        for (let j = 0; j < a.getNumCols(); j++) {
          expect(result.get(i, j)).toBeCloseTo(a.get(i, j), 3);
        }
      }
    });
  });
});
