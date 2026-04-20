import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * VULNERABILIDADE 3: Broken Access Control (Client-side)
   * A role é lida do AsyncStorage e determina quais botões mostrar
   * Um atacante pode:
   * 1. Modificar o valor da role no AsyncStorage
   * 2. Recarregar a tela para ver novos recursos
   */
  useEffect(() => {
    loadRoleFromStorage();
  }, []);

  const loadRoleFromStorage = async () => {
    try {
      setIsLoading(true);
      // ⚠️ VULNERÁVEL: Lendo role do AsyncStorage (texto claro)
      // Um atacante pode modificar este valor diretamente
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);
    } catch (error) {
      console.error('Erro ao carregar role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert('Erro', 'Falha ao fazer logout');
    }
  };

  const handleModifyRole = async () => {
    // ⚠️ DEMONSTRAÇÃO: Botão que permite modificar a role
    Alert.alert(
      'Modificar Role (Demonstração)',
      'Escolha um novo role:',
      [
        {
          text: 'Comprador',
          onPress: async () => {
            await AsyncStorage.setItem('role', 'comprador');
            loadRoleFromStorage();
          },
        },
        {
          text: 'Vendedor',
          onPress: async () => {
            await AsyncStorage.setItem('role', 'vendedor');
            loadRoleFromStorage();
          },
        },
        {
          text: 'Administrador',
          onPress: async () => {
            await AsyncStorage.setItem('role', 'administrador');
            loadRoleFromStorage();
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.username}>{user?.username || 'Usuário'}</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Role Atual:</Text>
          <Text style={[styles.roleValue, getRoleStyle(role)]}>
            {role?.toUpperCase() || 'Desconhecido'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Seção visível para TODOS os usuários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Recursos Públicos</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Ver Catálogo</Text>
          </TouchableOpacity>
          <Text style={styles.description}>Disponível para todos os usuários</Text>
        </View>

        {/* VULNERABILIDADE: Se role === 'comprador' */}
        {(role === 'comprador' || role === null) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Acesso Comprador</Text>
            <TouchableOpacity style={[styles.button, styles.buyerButton]}>
              <Text style={styles.buttonText}>📦 Ver Carrinho</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buyerButton]}>
              <Text style={styles.buttonText}>💳 Minhas Compras</Text>
            </TouchableOpacity>
            <Text style={styles.description}>Role: Comprador</Text>
          </View>
        )}

        {/* VULNERABILIDADE: Se role === 'vendedor' */}
        {(role === 'vendedor' || role === 'administrador') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Acesso Vendedor</Text>
            <TouchableOpacity style={[styles.button, styles.sellerButton]}>
              <Text style={styles.buttonText}>➕ Adicionar Produto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.sellerButton]}>
              <Text style={styles.buttonText}>📊 Meus Produtos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.sellerButton]}>
              <Text style={styles.buttonText}>💰 Relatório de Vendas</Text>
            </TouchableOpacity>
            <Text style={styles.description}>Role: Vendedor</Text>
          </View>
        )}

        {/* VULNERABILIDADE: Se role === 'administrador' - BOTÃO VERMELHO */}
        {role === 'administrador' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Acesso Administrador</Text>
            <TouchableOpacity style={[styles.button, styles.adminButton]}>
              <Text style={styles.adminButtonText}>🔴 Painel de Administração (Acesso Restrito)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.adminButton]}>
              <Text style={styles.adminButtonText}>👥 Gerenciar Usuários</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.adminButton]}>
              <Text style={styles.adminButtonText}>🔐 Logs de Sistema</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.adminButton]}>
              <Text style={styles.adminButtonText}>⚙️ Configurações</Text>
            </TouchableOpacity>
            <Text style={styles.description}>Role: Administrador</Text>
          </View>
        )}
      </View>

      {/* Botão de demonstração - permite modificar role */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>🧪 Demonstração de Vulnerabilidade</Text>
        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleModifyRole}
        >
          <Text style={styles.demoButtonText}>Modificar Role (Simular Ataque)</Text>
        </TouchableOpacity>
        <Text style={styles.demoDescription}>
          ⚠️ Este botão demonstra como um atacante pode modificar o role armazenado no AsyncStorage para acessar recursos restritos.
        </Text>
      </View>

      {/* Botão de logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getRoleStyle(role: string | null) {
  switch (role) {
    case 'administrador':
      return styles.roleAdmin;
    case 'vendedor':
      return styles.roleSeller;
    case 'comprador':
    default:
      return styles.roleBuyer;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  roleLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  roleValue: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleAdmin: {
    backgroundColor: '#ff4444',
    color: '#fff',
  },
  roleSeller: {
    backgroundColor: '#ffa500',
    color: '#fff',
  },
  roleBuyer: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  buyerButton: {
    backgroundColor: '#4CAF50',
  },
  sellerButton: {
    backgroundColor: '#ffa500',
  },
  adminButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  demoSection: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },
  demoButton: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  demoDescription: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
