// https://stackblitz.com/edit/angular-waihvh?file=src%2Fmain.ts
import 'zone.js/dist/zone';
import { Component, enableProdMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';

enum Direction {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST  = 'EAST',
  WEST  = 'WEST',
}
enum Commands {
  PLACE  = 'PLACE ',
  MOVE   = 'MOVE',
  LEFT   = 'LEFT',
  RIGHT  = 'RIGHT',
  REPORT = 'REPORT',
}
enum SquareColor {
  BLACK = 'BLACK',
  WHITE = 'WHITE',
}
enum MathOperator {
  ADD = '+',
  SUB = '-',
}

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input (keyup)="getUserInput($event)">
    <button type="button" (click)="processCommand()">
      Execute Command
    </button>
    <textarea readonly rows="8" cols="38">
      {{scrollLog}}
    </textarea>
  `,
})
export class App {
  
  /* Public properties */
  public scrollLog: string    = '';
  public inputCommand: string = '';

  /* Private properties */
  private _pawnDirection: string;
  private _pawnSquareColor: string;
  private _appName: string                = "Chessboard_AakashNaik";
  private _pawnPosition: number[][]       = [];
  private _isPawnPlacedOnBoard: boolean   = false;
  private _isFirstMoveAfterPlace: boolean = true;

  /* 
     Method getUserInput:
     Get the raw input and do the preliminary sanitization.
  */
  public getUserInput(event: any) {
    
    this.inputCommand = event.target.value.trim().toUpperCase();
  }

  /* 
     Method processCommand:
     Validate and execute the various commands with their parameters.
  */
  public processCommand() {
    
    this.announceToLog(this.inputCommand);

    if (this.inputCommand.startsWith(Commands.PLACE))
      this.commandPlace(this.inputCommand);
    else if (
      this._isPawnPlacedOnBoard &&
      this.inputCommand.startsWith(Commands.MOVE)
    )
      this.commandMove(this.inputCommand);
    else if (
      this._isPawnPlacedOnBoard &&
      (this.inputCommand === Commands.LEFT ||
        this.inputCommand === Commands.RIGHT)
    )
      this.commandLeftOrRight(this.inputCommand);
    else if (
      this._isPawnPlacedOnBoard &&
      this.inputCommand === Commands.REPORT
    )
      this.commandReport();
    else if (!this._isPawnPlacedOnBoard)
      console.log('EXECUTE PLACE COMMAND FIRST');
    else
      console.log('INVALID COMMAND');
  }

  /* 
     Method commandPlace:
     Execute the PLACE command for the pawn.
     Also updates the square color for the pawn.
     Format: PLACE <X>,<Y>,<DIRECTION>,<SQUARE_COLOR>
     Eg:     PLACE 0,1,NORTH,WHITE
  */
  private commandPlace(inputCmdString: string) {
    
    let inputParams: string;
    let inputParamsList: any[];
    let pawnPosValue_X: number;
    let pawnPosValue_Y: number;
    let isError: boolean = false;

    inputParams     = inputCmdString.substring(inputCmdString.indexOf(' ') + 1);
    inputParamsList = inputParams.split(',', 4);

    // PLACE command will always have 4 input parameters.
    if (inputParamsList.length !== 4) {
      console.log('INVALID PLACE COMMAND');
      isError = true;
    }
    // Validate input direction.
    if (!(<any>Object).values(Direction).includes(inputParamsList[2])) {
      console.log('INVALID DIRECTION IN PLACE COMMAND');
      isError = true;
    }
    // Validate square color.
    if (!(<any>Object).values(SquareColor).includes(inputParamsList[3])) {
      console.log('INVALID SQUARE COLOR IN PLACE COMMAND');
      isError = true;
    }

    if (isError)
      return;

    pawnPosValue_X = parseInt(inputParamsList[0]);
    pawnPosValue_Y = parseInt(inputParamsList[1]);

    // Validate if pawn position (x,y) to place
    // is not outside the board.
    if (
      this.isValidPawnPosition(pawnPosValue_X) &&
      this.isValidPawnPosition(pawnPosValue_Y)
    ) {
      this._pawnPosition = [];
      this._pawnPosition.push([pawnPosValue_X, pawnPosValue_Y]);
    }
    else
      return;

    // [1] _isPawnPlacedOnBoard:
    //     Indicates that the pawn is placed on board or not.
    // [2] _isFirstMoveAfterPlace:
    //     Indicates if the first MOVE command after the PLACE command is executed.
    //     Only the first MOVE command allows the pawn to move upto 2 squares.
    this._isFirstMoveAfterPlace = true;
    this._isPawnPlacedOnBoard   = true;

    // After successful validation, assign the direction and sqaure color.
    this._pawnDirection   = inputParamsList[2];
    this._pawnSquareColor = inputParamsList[3];

    console.log(
      'POSITION AFTER PAWN PLACED ' +
                 this._pawnPosition +
                                ',' +
                this._pawnDirection +
                                ',' +
              this._pawnSquareColor
    );
  }

  /* 
     Method commandMove:
     Execute the MOVE command to move the pawn by 1 or 2 squares.
     Also updates the square color for the pawn.
     Format: MOVE
             MOVE <COUNT> 
     Eg:     MOVE
             MOVE 1
             MOVE 2
  */
  private commandMove(inputCmdString: string) {
    
    // Set default increment to 1.
    let moveIncrement: number = 1;

    if (!Number.isNaN(parseInt(inputCmdString.substring(5, 6))))
      moveIncrement = parseInt(inputCmdString.substring(5, 6));
    else if (!(inputCmdString === Commands.MOVE)) {
      console.log('INVALID COMMAND');
      return;
    }

    if (
      moveIncrement < 1 ||
      moveIncrement > 2 ||
      (moveIncrement === 2 && 
       !this._isFirstMoveAfterPlace)
    ) {
      console.log(
        'INVALID MOVE: PAWN POSITION MOVED IS (LESS THAN 1 / MORE THAN 2) OR TRIED TO MOVE 2 POSITIONS  WHEN IT WAS NOT THE FIRST MOVE COMMAND'
      );
      return;
    }

    // X axis is East, Y axis is North.
    // When pawn is at origin (0,0) = (x,y).
    switch (this._pawnDirection) {
      case Direction.NORTH:
        this.processPawnMove(0,                // X axis.
                             1,                // Y axis.
                             MathOperator.ADD, // Add or Subtract.
                             moveIncrement     // Number of squares the pawn will move.
        );
        break;
      case Direction.EAST:
        this.processPawnMove(0,
                             0, 
                             MathOperator.ADD, 
                             moveIncrement
        );
        break;
      case Direction.SOUTH:
        this.processPawnMove(0, 
                             1, 
                             MathOperator.SUB, 
                             moveIncrement
        );
        break;
      case Direction.WEST:
        this.processPawnMove(0,
                             0, 
                             MathOperator.SUB, 
                             moveIncrement
        );
        break;
      default:
        console.log('INVALID DIRECTION' + this._pawnDirection);
        break;
    }

    console.log('POSITION AFTER PAWN MOVE ' + this._pawnPosition);
  }

  /* 
     Method commandLeftOrRight:
     Execute the LEFT or RIGHT command to change the direction for the pawn.
     Format: LEFT
             RIGHT
     Eg:     LEFT
             RIGHT
  */
  private commandLeftOrRight(inputCmdString: string) {
    
    // Directions in clockwise fashion -> [N,E,S,W]
    switch (this._pawnDirection) {
      case Direction.NORTH:
        if (inputCmdString === Commands.LEFT)
          this._pawnDirection = Direction.WEST;
        else
          this._pawnDirection = Direction.EAST;
        break;
      case Direction.EAST:
        if (inputCmdString === Commands.LEFT)
          this._pawnDirection = Direction.NORTH;
        else 
          this._pawnDirection = Direction.SOUTH;
        break;
      case Direction.SOUTH:
        if (inputCmdString === Commands.LEFT)
          this._pawnDirection = Direction.EAST;
        else 
          this._pawnDirection = Direction.WEST;
        break;
      case Direction.WEST:
        if (inputCmdString === Commands.LEFT)
          this._pawnDirection = Direction.SOUTH;
        else 
          this._pawnDirection = Direction.NORTH;
        break;
      default:
        console.log('INVALID DIRECTION' + this._pawnDirection);
        break;
    }

    console.log(
      'POSITION AFTER PAWN ROTATED TO ' +
                      this.inputCommand +
                                 ' is ' +
                     this._pawnPosition +
                   ' and direction is ' +
                    this._pawnDirection
    );
  }

  /* 
     Method commandReport:
     Execute the REPORT command to show the status for the pawn.
     Format: REPORT
     Eg:     REPORT
  */
  private commandReport() {
    
    let pawnReportStatus: string =
            'PAWN REPORT: ' +
         this._pawnPosition +
                        ',' +
        this._pawnDirection +
                        ',' +
      this._pawnSquareColor
    ;
    
    console.log(pawnReportStatus);
    this.announceToLog(pawnReportStatus);
  }

  /* 
     Method processPawnMove:
     Logic to validate and process the MOVE command for the pawn.
  */
  private processPawnMove(pawnPos_X: number,
                          pawnPos_Y: number,
                          mathOperator: string,
                          moveIncrement: number) {

    // pawnPosAny_Value:
    // Contains actual value of either position X or Y for validation.
    let pawnPosAny_Value: number;

    if (mathOperator === MathOperator.ADD)
      pawnPosAny_Value = this._pawnPosition[pawnPos_X][pawnPos_Y] + moveIncrement;
    else
      pawnPosAny_Value = this._pawnPosition[pawnPos_X][pawnPos_Y] - moveIncrement;

    if (this.isValidPawnPosition(pawnPosAny_Value)) {
      // The first MOVE command after the PLACE command is successful.
      this._isFirstMoveAfterPlace = false;
      // Set the new pawn position.
      this._pawnPosition[pawnPos_X][pawnPos_Y] = pawnPosAny_Value;
      // Set the new square color for the pawn, if applicable.
      this.updatePawnSquareColor(moveIncrement);
    }
  }

  /* 
     Method updatePawnSquareColor:
     Logic to update the square color for the pawn when it is moved.
  */
  private updatePawnSquareColor(moveIncrement: number) {
    
    if (moveIncrement === 1) {
      if (this._pawnSquareColor === SquareColor.BLACK)
        this._pawnSquareColor = SquareColor.WHITE;
      else if (this._pawnSquareColor === SquareColor.WHITE)
        this._pawnSquareColor = SquareColor.BLACK;
    }
  }

  /* 
     Method isValidPawnPosition:
     Validate if the pawn will not go outside the board for the given position.
  */
  private isValidPawnPosition(pawnPos: number): boolean {
    
    if (pawnPos < 0 || pawnPos > 7) {
      console.log('INVALID MOVE: PAWN WILL BE OUTSIDE THE BOARD');
      return false;
    } 
    else 
      return true;
  }

  /* 
     Method announceToLog:
     Print messages to the scrollLog for display purposes.
  */
  private announceToLog(msgToLog: string) {
    
    this.scrollLog += msgToLog + '\n';
  }
}

enableProdMode();
bootstrapApplication(App);
