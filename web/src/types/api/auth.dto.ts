/**
 * Backend API Data Transfer Object (DTO) contracts for OTD Authentication.
 * Mirrors AI-FASHION-OTD/src/modules/auth/*.ts
 */

export interface BackendLoginRequestDto {
  email: string;
  password: string;
}

export interface BackendRegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

export interface BackendAuthUserDto {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  createdAt?: string;
}

/**
 * Current Express auth controller returns top-level `{ success, message, user, accessToken }`.
 * Optional `data` property is typed only for defensive envelope normalization.
 */
export interface BackendAuthResponseDto {
  success?: boolean;
  statusCode?: number;
  message?: string;
  user?: BackendAuthUserDto;
  accessToken?: string;
  data?: {
    user?: BackendAuthUserDto;
    accessToken?: string;
  };
}

export interface BackendLogoutResponseDto {
  success?: boolean;
  message?: string;
}

