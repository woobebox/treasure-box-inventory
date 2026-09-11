export const navigationRequestEvent = 'treasure-box:navigation-request';

export interface NavigationRequestDetail {
  resume: () => void;
}

export function requestAppNavigation(resume: () => void): void {
  const event = new CustomEvent<NavigationRequestDetail>(navigationRequestEvent, {
    cancelable: true,
    detail: { resume },
  });
  if (window.dispatchEvent(event)) resume();
}
