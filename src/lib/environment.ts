/**
 * Environment detection and URL configuration
 */

export const isDevTestEnvironment = () => {
  return window.location.hostname.includes('devtest');
};

export const getVairifyUrl = () => {
  return isDevTestEnvironment() 
    ? 'https://devtest.vairify.io' 
    : 'https://vairify.io';
};

export const getChainPassUrl = () => {
  return isDevTestEnvironment() 
    ? 'https://devtest.chainpass.id' 
    : 'https://chainpass.id';
};
