
/**
 * Represents a line and character position, such as the position of the cursor.
 * Position objects are __immutable__.
 */
export class Position {

    /**
     * The zero-based line value.
     */
    readonly line: number;

    /**
     * The zero-based character value.
     */
    readonly character: number;

    /**
     * @param line A zero-based line value.
     * @param character A zero-based character value.
     */
    constructor(line: number, character: number) {
        if (line < 0) {
            throw new Error('line must be non-negative');
        }
        if (character < 0) {
            throw new Error('character must be non-negative');
        }
        this.line = line;
        this.character = character;
    }

    /**
     * Check if this position is before `other`.
     *
     * @param other A position.
     * @returns `true` if position is on a smaller line
     * or on the same line on a smaller character.
     */
    isBefore(other: Position): boolean {
        if (this.line < other.line) {
            return true;
        }
        if (this.line === other.line) {
            return this.character < other.character;
        }
        return false;
    }

    /**
     * Check if this position is before or equal to `other`.
     *
     * @param other A position.
     * @returns `true` if position is on a smaller line
     * or on the same line on a smaller or equal character.
     */
    isBeforeOrEqual(other: Position): boolean {
        if (this.line < other.line) {
            return true;
        }
        if (this.line === other.line) {
            return this.character <= other.character;
        }
        return false;
    }

    /**
     * Check if this position is after `other`.
     *
     * @param other A position.
     * @returns `true` if position is on a greater line
     * or on the same line on a greater character.
     */
    isAfter(other: Position): boolean {
        return !this.isBeforeOrEqual(other);
    }

    /**
     * Check if this position is after or equal to `other`.
     *
     * @param other A position.
     * @returns `true` if position is on a greater line
     * or on the same line on a greater or equal character.
     */
    isAfterOrEqual(other: Position): boolean {
        return !this.isBefore(other);
    }

    /**
     * Check if this position is equal to `other`.
     *
     * @param other A position.
     * @returns `true` if the line and character of both positions are equal.
     */
    isEqual(other: Position): boolean {
        return this.line === other.line && this.character === other.character;
    }

    /**
     * Compare this to `other`.
     *
     * @param other A position.
     * @returns A number smaller than zero if this position is before the given position,
     * a number greater than zero if this position is after the given position, or zero when
     * this and the given position are equal.
     */
    compareTo(other: Position): number {
        if (this.line < other.line) {
            return -1;
        } else if (this.line > other.line) {
            return 1;
        } else {
            // same line
            if (this.character < other.character) {
                return -1;
            } else if (this.character > other.character) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    /**
     * Create a new position relative to this position.
     *
     * @param lineDelta Delta value for the line value, default is `0`.
     * @param characterDelta Delta value for the character value, default is `0`.
     * @returns A position which line and character is the sum of the current line and
     * character and the corresponding deltas.
     */
    translate(lineDelta?: number, characterDelta?: number): Position {
        if (lineDelta === null || lineDelta === undefined) {
            lineDelta = 0;
        }
        if (characterDelta === null || characterDelta === undefined) {
            characterDelta = 0;
        }
        if (lineDelta === 0 && characterDelta === 0) {
            return this;
        }
        return new Position(this.line + lineDelta, this.character + characterDelta);
    }

    /**
     * Derive a new position from this position.
     *
     * @param line Value that should be used as line value, default is the existing value
     * @param character Value that should be used as character value, default is the existing value
     * @returns A position where line and character are replaced by the given values.
     */
    with(line?: number, character?: number): Position {
        if (line === null || line === undefined) {
            line = this.line;
        }
        if (character === null || character === undefined) {
            character = this.character;
        }
        if (line === this.line && character === this.character) {
            return this;
        }
        return new Position(line, character);
    }

}


/**
 * A range represents an ordered pair of two positions.
 * It is guaranteed that start.isBeforeOrEqual(end)
 *
 * Range objects are __immutable__.
 */
export class Range {

    /**
     * The start position. It is before or equal to end.
     */
    readonly start: Position;

    /**
     * The end position. It is after or equal to start.
     */
    readonly end: Position;

    /**
     * Create a new range from two positions. If `start` is not
     * before or equal to `end`, the values will be swapped.
     *
     * @param start A position.
     * @param end A position.
     */
    constructor(start: Position, end: Position);

    /**
     * Create a new range from number coordinates. It is a shorter equivalent of
     * using `new Range(new Position(startLine, startCharacter), new Position(endLine, endCharacter))`
     *
     * @param startLine A zero-based line value.
     * @param startCharacter A zero-based character value.
     * @param endLine A zero-based line value.
     * @param endCharacter A zero-based character value.
     */
    constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number);

    constructor(startOrLine: Position | number, endOrCharacter: Position | number, endLine?: number, endCharacter?: number) {
        let start: Position;
        let end: Position;

        if (typeof startOrLine === 'number' && typeof endOrCharacter === 'number' &&
            typeof endLine === 'number' && typeof endCharacter === 'number') {
            // constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number)
            start = new Position(startOrLine, endOrCharacter);
            end = new Position(endLine, endCharacter);
        } else if (startOrLine instanceof Position && endOrCharacter instanceof Position) {
            // constructor(start: Position, end: Position)
            start = startOrLine;
            end = endOrCharacter;
        } else {
            throw new Error('Invalid arguments');
        }

        // Ensure start is before or equal to end
        if (start.isAfter(end)) {
            this.start = end;
            this.end = start;
        } else {
            this.start = start;
            this.end = end;
        }
    }

    /**
     * `true` if `start` and `end` are equal.
     */
    get isEmpty(): boolean {
        return this.start.isEqual(this.end);
    }

    /**
     * `true` if `start.line` and `end.line` are equal.
     */
    get isSingleLine(): boolean {
        return this.start.line === this.end.line;
    }

    /**
     * Check if a position or a range is contained in this range.
     *
     * @param positionOrRange A position or a range.
     * @returns `true` if the position or range is inside or equal
     * to this range.
     */
    contains(positionOrRange: Position | Range): boolean {
        if (positionOrRange instanceof Range) {
            return this.contains(positionOrRange.start) && this.contains(positionOrRange.end);
        } else if (positionOrRange instanceof Position) {
            return positionOrRange.isAfterOrEqual(this.start) && positionOrRange.isBeforeOrEqual(this.end);
        }
        return false;
    }

    /**
     * Check if `other` equals this range.
     *
     * @param other A range.
     * @returns `true` when start and end are equal to
     * start and end of this range.
     */
    isEqual(other: Range): boolean {
        return this.start.isEqual(other.start) && this.end.isEqual(other.end);
    }

    /**
     * Intersect `range` with this range and returns a new range or `undefined`
     * if the ranges have no overlap.
     *
     * @param range A range.
     * @returns A range of the greater start and smaller end positions. Will
     * return undefined when there is no overlap.
     */
    intersection(range: Range): Range | undefined {
        const start = this.start.isAfter(range.start) ? this.start : range.start;
        const end = this.end.isBefore(range.end) ? this.end : range.end;
        if (start.isAfter(end)) {
            return undefined;
        }
        return new Range(start, end);
    }

    /**
     * Compute the union of `other` with this range.
     *
     * @param other A range.
     * @returns A range of smaller start position and the greater end position.
     */
    union(other: Range): Range {
        const start = this.start.isBefore(other.start) ? this.start : other.start;
        const end = this.end.isAfter(other.end) ? this.end : other.end;
        return new Range(start, end);
    }

    /**
     * Derived a new range from this range.
     *
     * @param start A position that should be used as start. The default value is the current start.
     * @param end A position that should be used as end. The default value is the current end.
     * @returns A range derived from this range with the given start and end position.
     * If start and end are not different `this` range will be returned.
     */
    with(start?: Position, end?: Position): Range {
        if (start === null || start === undefined) {
            start = this.start;
        }
        if (end === null || end === undefined) {
            end = this.end;
        }
        if (start.isEqual(this.start) && end.isEqual(this.end)) {
            return this;
        }
        return new Range(start, end);
    }

}

/**
 * Represents a text selection in an editor.
 */
export class Selection extends Range {

    /**
     * The position at which the selection starts.
     * This position might be before or after active.
     */
    anchor: Position;

    /**
     * The position of the cursor.
     * This position might be before or after anchor.
     */
    active: Position;

    /**
     * Create a selection from two positions.
     *
     * @param anchor A position.
     * @param active A position.
     */
    constructor(anchor: Position, active: Position);

    /**
     * Create a selection from four coordinates.
     *
     * @param anchorLine A zero-based line value.
     * @param anchorCharacter A zero-based character value.
     * @param activeLine A zero-based line value.
     * @param activeCharacter A zero-based character value.
     */
    constructor(anchorLine: number, anchorCharacter: number, activeLine: number, activeCharacter: number);

    constructor(anchorOrLine: Position | number, activeOrCharacter: Position | number, activeLine?: number, activeCharacter?: number) {
        let anchor: Position;
        let active: Position;

        if (typeof anchorOrLine === 'number' && typeof activeOrCharacter === 'number' &&
            typeof activeLine === 'number' && typeof activeCharacter === 'number') {
            // constructor(anchorLine: number, anchorCharacter: number, activeLine: number, activeCharacter: number)
            anchor = new Position(anchorOrLine, activeOrCharacter);
            active = new Position(activeLine, activeCharacter);
        } else if (anchorOrLine instanceof Position && activeOrCharacter instanceof Position) {
            // constructor(anchor: Position, active: Position)
            anchor = anchorOrLine;
            active = activeOrCharacter;
        } else {
            throw new Error('Invalid arguments');
        }

        // Call Range constructor with start and end based on anchor and active
        super(anchor, active);

        this.anchor = anchor;
        this.active = active;
    }

    /**
     * A selection is reversed if its anchor is the end position.
     */
    get isReversed(): boolean {
        return this.anchor === this.end;
    }
}
