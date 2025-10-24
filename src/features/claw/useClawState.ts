/**
 * Finite State Machine Hook for Claw Machine Playthrough
 * Manages transitions between idle, spinning, grabbing, and result states.
 */

import { useReducer, useCallback } from 'react';
import {
  ClawMachineInternalState,
  ClawMachineAction,
  MachineState,
  PlayResult,
  ClaimResult,
} from './types';

const initialState: ClawMachineInternalState = {
  state: MachineState.Idle,
  playResult: null,
  claimResult: null,
  currentX: 0,
  highlightId: null,
  error: null,
};

/**
 * State reducer enforcing valid transitions.
 * Guards prevent illegal state changes (e.g., GRAB without ATTACH_RESULT).
 */
function clawMachineReducer(
  state: ClawMachineInternalState,
  action: ClawMachineAction,
): ClawMachineInternalState {
  switch (action.type) {
    case 'PLAY':
      // Only allow play from idle
      if (state.state !== MachineState.Idle) return state;
      return {
        ...state,
        state: MachineState.Spinning,
        playResult: null,
        claimResult: null,
        error: null,
      };

    case 'ATTACH_RESULT':
      // Server result arrives during spin
      if (state.state !== MachineState.Spinning) return state;
      return {
        ...state,
        playResult: action.payload,
        highlightId: action.payload.prize.id,
      };

    case 'DECELERATE':
      if (state.state !== MachineState.Spinning && state.state !== MachineState.Decelerating)
        return state;
      return {
        ...state,
        state: MachineState.Decelerating,
      };

    case 'GRAB':
      if (state.state !== MachineState.Decelerating) return state;
      return {
        ...state,
        state: MachineState.Grabbing,
      };

    case 'REVEAL':
      // Can go to reveal from grabbing or lifting
      if (
        state.state !== MachineState.Grabbing &&
        state.state !== MachineState.Lifting
      ) {
        return state;
      }
      return {
        ...state,
        state: MachineState.Reveal,
      };

    case 'CLAIM':
      if (state.state !== MachineState.Reveal) return state;
      return {
        ...state,
        claimResult: action.payload,
        state: MachineState.Settle,
      };

    case 'RESET':
      return initialState;

    case 'SET_CURRENT_X':
      return {
        ...state,
        currentX: action.payload,
      };

    case 'ERROR':
      return {
        ...state,
        error: action.payload,
        state: MachineState.Idle,
      };

    default:
      return state;
  }
}

/**
 * Hook encapsulating the claw machine state machine.
 * Provides dispatch, state selectors, and guard helpers.
 */
export function useClawState() {
  const [state, dispatch] = useReducer(clawMachineReducer, initialState);

  // Selectors
  const canPlay = useCallback(() => state.state === MachineState.Idle, [state.state]);
  const isBusy = useCallback(
    () => state.state !== MachineState.Idle && state.state !== MachineState.Settle,
    [state.state],
  );
  const isRevealOpen = useCallback(
    () => state.state === MachineState.Reveal || state.state === MachineState.Settle,
    [state.state],
  );

  // Actions
  const play = useCallback(() => {
    dispatch({ type: 'PLAY' });
  }, []);

  const attachResult = useCallback((result: PlayResult) => {
    dispatch({ type: 'ATTACH_RESULT', payload: result });
  }, []);

  const decelerate = useCallback(() => {
    dispatch({ type: 'DECELERATE' });
  }, []);

  const grab = useCallback(() => {
    dispatch({ type: 'GRAB' });
  }, []);

  const reveal = useCallback(() => {
    dispatch({ type: 'REVEAL' });
  }, []);

  const claim = useCallback((result: ClaimResult) => {
    dispatch({ type: 'CLAIM', payload: result });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const setCurrentX = useCallback((x: number) => {
    dispatch({ type: 'SET_CURRENT_X', payload: x });
  }, []);

  const setError = useCallback((msg: string) => {
    dispatch({ type: 'ERROR', payload: msg });
  }, []);

  return {
    state,
    dispatch,
    // Selectors
    canPlay,
    isBusy,
    isRevealOpen,
    // Action creators
    play,
    attachResult,
    decelerate,
    grab,
    reveal,
    claim,
    reset,
    setCurrentX,
    setError,
  };
}
