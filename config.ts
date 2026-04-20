/**
 * Configuração de API da aplicação
 * ⚠️ VULNERÁVEL: Usando HTTP em vez de HTTPS (M1: Insecure Communication)
 */

// Para Android Emulator, usar 10.0.2.2 (que mapeia para localhost do host)
// Para iOS Simulator ou dispositivo real, usar seu IP local
// Você pode usar: adb shell "getprop ro.kernel.qemu.host.addr" para confirmar

//export const API_BASE_URL = 'http://10.0.2.2:3000';
export const API_BASE_URL = 'http://192.168.5.18:3000';


export const IS_INSECURE = true;
