import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { paymentService, PaymentRequestPayload, PaymentConfirmPayload } from '../services/paymentService';
import { productService, AddProductPayload } from '../services/productService';
import { adminService, AdminDeleteProductPayload, AdminViewTransactionsPayload } from '../services/adminService';
import { storageService, Purchase, Product, AdminLog } from '../services/storageService';

type Role = 'comprador' | 'vendedor' | 'administrador';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para modal de pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('1234567890123456');
  const [cvv, setCvv] = useState('123');
  const [amount, setAmount] = useState('99.90');
  const [waitingOTP, setWaitingOTP] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');

  // Estado para adicionar produto
  const [showProductModal, setShowProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');

  // Estado para admin
  const [adminPassword, setAdminPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [allTransactions, setAllTransactions] = useState<Purchase[]>([]);

  // Carregar dados ao montar
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (user?.role) {
        setRole(user.role);
      }

      // Carregar produtos
      const prods = await storageService.getProducts();
      setProducts(prods);

      // Carregar compras do usuário
      if (user?.username) {
        const purchaseHistory = await storageService.getPurchases(user.username);
        setPurchases(purchaseHistory);
      }

      // Carregar logs admin
      const logs = await storageService.getAdminLogs();
      setAdminLogs(logs);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role, user?.username]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert('Erro', 'Falha ao fazer logout');
    }
  };

  // ====== PAYMENT FUNCTIONS ======
  const handleRequestOTP = async () => {
    if (!cardNumber || !cvv || !amount) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      setWaitingOTP(true);

      const payload: PaymentRequestPayload = {
        username: user?.username || '',
        cardLastDigits: cardNumber.slice(-4),
        cvv: cvv,
        amount: parseFloat(amount),
      };

      const response = await paymentService.requestOTP(payload);

      if (response.success) {
        setOtpToken(response.iToken);
        setOtpMessage(response.message);
        setOtpCode('');
      } else {
        Alert.alert('Erro', 'Falha ao solicitar OTP');
      }
    } catch (error) {
      Alert.alert('Erro', `Erro ao solicitar OTP: ${error}`);
    } finally {
      setWaitingOTP(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!otpCode) {
      Alert.alert('Erro', 'Digite o código OTP');
      return;
    }

    try {
      const payload: PaymentConfirmPayload = {
        username: user?.username || '',
        iToken: otpToken,
        userInputCode: otpCode,
        cardLastDigits: cardNumber.slice(-4),
        amount: parseFloat(amount),
      };

      const response = await paymentService.confirmPayment(payload);

      if (response.success) {
        Alert.alert('✅ Sucesso', response.message, [
          {
            text: 'OK',
            onPress: () => {
              setShowPaymentModal(false);
              loadDashboardData();
            },
          },
        ]);
      } else {
        Alert.alert('❌ Erro', response.message);
      }
    } catch (error) {
      Alert.alert('Erro', `Erro ao confirmar pagamento: ${error}`);
    }
  };

  // ====== PRODUCT FUNCTIONS ======
  const handleAddProduct = async () => {
    if (!productName || !productPrice) {
      Alert.alert('Erro', 'Preencha nome e preço');
      return;
    }

    try {
      const payload: AddProductPayload = {
        name: productName,
        price: parseFloat(productPrice),
        description: productDescription,
        seller: user?.username || '',
      };

      const response = await productService.addProduct(payload);

      if (response.success) {
        Alert.alert('✅ Sucesso', 'Produto cadastrado com sucesso!', [
          {
            text: 'OK',
            onPress: () => {
              setShowProductModal(false);
              setProductName('');
              setProductPrice('');
              setProductDescription('');
              loadDashboardData();
            },
          },
        ]);
      } else {
        Alert.alert('Erro', response.message);
      }
    } catch (error) {
      Alert.alert('Erro', `Erro ao adicionar produto: ${error}`);
    }
  };

  // ====== ADMIN FUNCTIONS ======
  const handleDeleteProduct = async (productId: string) => {
    if (!adminPassword) {
      Alert.alert('Erro', 'Digite a senha admin');
      return;
    }

    try {
      const payload: AdminDeleteProductPayload = {
        productId,
        adminUsername: 'admin',
        adminPassword,
      };

      const response = await adminService.deleteProduct(payload);

      if (response.success) {
        Alert.alert('✅ Sucesso', response.message, [
          {
            text: 'OK',
            onPress: () => {
              loadDashboardData();
            },
          },
        ]);
      } else {
        Alert.alert('Erro', response.message);
      }
    } catch (error) {
      Alert.alert('Erro', `Erro ao deletar: ${error}`);
    }
  };

  const handleViewAllTransactions = async () => {
    if (!adminPassword) {
      Alert.alert('Erro', 'Digite a senha admin');
      return;
    }

    try {
      const payload: AdminViewTransactionsPayload = {
        adminUsername: 'admin',
        adminPassword,
      };

      const response = await adminService.viewAllTransactions(payload);

      if (response.success) {
        setAllTransactions(response.data || []);
        Alert.alert('✅ Transações Carregadas', `Total: ${response.data?.length || 0} transações`);
      } else {
        Alert.alert('Erro', response.message);
      }
    } catch (error) {
      Alert.alert('Erro', `Erro ao carregar: ${error}`);
    }
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ PoucoSeguro App</Text>
        <Text style={styles.username}>{user?.username || 'Usuário'}</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Role Atual:</Text>
          <Text style={[styles.roleValue, getRoleStyle(role)]}>
            {role?.toUpperCase() || 'Desconhecido'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* ====== COMPRADOR ====== */}
        {role === 'comprador' && (
          <>
            {/* Realizar Compra */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛍️ Realizar Compra</Text>
              <TouchableOpacity
                style={[styles.button, styles.buyerButton]}
                onPress={() => setShowPaymentModal(true)}
              >
                <Text style={styles.buttonText}>💳 Efetuar Pagamento</Text>
              </TouchableOpacity>
              <Text style={styles.description}>Enviar dados de cartão via HTTP inseguro (M1)</Text>
            </View>

            {/* Histórico de Compras */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📜 Histórico de Compras</Text>
              {purchases.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma compra realizada</Text>
              ) : (
                purchases.map((purchase) => (
                  <View key={purchase.id} style={styles.purchaseItem}>
                    <Text style={styles.purchaseText}>
                      💵 R$ {purchase.amount.toFixed(2)} - {new Date(purchase.timestamp).toLocaleDateString()}
                    </Text>
                    <Text style={styles.purchaseText}>ID: {purchase.transactionId}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Enviar Dados de Produto (M3: Broken Access Control) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📦 Enviar Dados de Produto</Text>
              <Text style={styles.warningText}>⚠️ Comprador NÃO deveria ter acesso!</Text>
              <TouchableOpacity
                style={[styles.button, styles.warningButton]}
                onPress={() => setShowProductModal(true)}
              >
                <Text style={styles.buttonText}>➕ Enviar Produto</Text>
              </TouchableOpacity>
              <Text style={styles.description}>Demonstra BrokenAccessControl (M3)</Text>
            </View>
          </>
        )}

        {/* ====== VENDEDOR ====== */}
        {role === 'vendedor' && (
          <>
            {/* Adicionar Novo Produto */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📦 Adicionar Novo Produto</Text>
              <TouchableOpacity
                style={[styles.button, styles.sellerButton]}
                onPress={() => setShowProductModal(true)}
              >
                <Text style={styles.buttonText}>➕ Novo Produto</Text>
              </TouchableOpacity>
              <Text style={styles.description}>Adicionar produto ao catálogo</Text>
            </View>

            {/* Meus Produtos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Meus Produtos</Text>
              {products.filter((p) => p.seller === user?.username).length === 0 ? (
                <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
              ) : (
                products
                  .filter((p) => p.seller === user?.username)
                  .map((product) => (
                    <View key={product.id} style={styles.productItem}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productPrice}>R$ {product.price.toFixed(2)}</Text>
                    </View>
                  ))
              )}
            </View>

            {/* Relatório de Vendas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💰 Relatório de Vendas</Text>
              <Text style={styles.statsText}>
                Produtos: {products.filter((p) => p.seller === user?.username).length}
              </Text>
            </View>
          </>
        )}

        {/* ====== ADMINISTRADOR ====== */}
        {role === 'administrador' && (
          <>
            {/* Modificar Banco de Dados */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔧 Modificar Banco de Dados</Text>
              <TouchableOpacity
                style={[styles.button, styles.adminButton]}
                onPress={() => {
                  Alert.alert(
                    'Operações Admin',
                    'Selecione uma operação:',
                    [
                      {
                        text: 'Deletar Produto',
                        onPress: () => {
                          Alert.prompt(
                            'Deletar Produto',
                            'Digite o ID do produto:',
                            (productId: any) => {
                              Alert.prompt(
                                'Confirmar Senha',
                                'Digite sua senha:',
                                (password: any) => {
                                  if (password) {
                                    setAdminPassword(password);
                                    handleDeleteProduct(productId);
                                  }
                                }
                              );
                            }
                          );
                        },
                      },
                      {
                        text: 'Ver Transações',
                        onPress: () => {
                          Alert.prompt(
                            'Credenciais Admin',
                            'Digite a senha admin:',
                            (password: any) => {
                              if (password) {
                                setAdminPassword(password);
                                handleViewAllTransactions();
                              }
                            }
                          );
                        },
                      },
                      { text: 'Cancelar', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.adminButtonText}>⚙️ Operações Admin</Text>
              </TouchableOpacity>
              <Text style={styles.description}>Deletar produtos, ver transações</Text>
            </View>

            {/* Logs de Sistema */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Logs de Sistema</Text>
              {adminLogs.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum log registrado</Text>
              ) : (
                adminLogs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <Text style={styles.logText}>{log.operation}</Text>
                    <Text style={styles.logText}>Admin: {log.adminUsername}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Todos os Produtos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📦 Todos os Produtos</Text>
              {products.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum produto</Text>
              ) : (
                products.map((product) => (
                  <View key={product.id} style={styles.adminProductItem}>
                    <View>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productPrice}>R$ {product.price.toFixed(2)}</Text>
                      <Text style={styles.productSeller}>Vendedor: {product.seller}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.prompt(
                          'Digite a senha admin',
                          'Confirme para deletar este produto',
                          [
                            { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
                            {
                              text: 'Deletar',
                              onPress: (password: any) => {
                                if (password) {
                                  setAdminPassword(password);
                                  handleDeleteProduct(product.id);
                                }
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Deletar</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Ver Todas as Transações */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💳 Transações de Todos os Usuários</Text>
              <TouchableOpacity
                style={[styles.button, styles.adminButton]}
                onPress={() => {
                  Alert.prompt(
                    'Credenciais Admin',
                    'Digite a senha admin (credenciais em query string - M1)',
                    [
                      { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
                      {
                        text: 'Ver',
                        onPress: (password: any) => {
                          if (password) {
                            setAdminPassword(password);
                            handleViewAllTransactions();
                          }
                        },
                      },
                    ],
                  );
                }}
              >
                <Text style={styles.adminButtonText}>📊 Carregar Transações</Text>
              </TouchableOpacity>

              {allTransactions.length > 0 && (
                <>
                  {allTransactions.map((txn) => (
                    <View key={txn.id} style={styles.transactionItem}>
                      <Text style={styles.transactionText}>
                        {txn.username}: R$ {txn.amount.toFixed(2)}
                      </Text>
                      <Text style={styles.transactionId}>{txn.transactionId}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </>
        )}
      </View>

      {/* ====== PAYMENT MODAL ====== */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPaymentModal(false);
          setWaitingOTP(false);
          setOtpCode('');
          setOtpToken('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💳 Pagamento Seguro (?)</Text>

            {!waitingOTP ? (
              <>
                <Text style={styles.modalLabel}>Número do Cartão</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="1234567890123456"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  maxLength={16}
                />

                <Text style={styles.modalLabel}>CVV</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />

                <Text style={styles.modalLabel}>Valor (R$)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="99.90"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />

                <TouchableOpacity
                  style={[styles.modalButton, { marginTop: 20 }]}
                  onPress={handleRequestOTP}
                >
                  <Text style={styles.modalButtonText}>Solicitar OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpMessage}>
                  <Text style={styles.otpMessageText}>{otpMessage}</Text>
                </View>

                <Text style={styles.modalLabel}>Digite o Código:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0000"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="numeric"
                  maxLength={4}
                />

                <TouchableOpacity
                  style={[styles.modalButton, { marginTop: 20 }]}
                  onPress={handleConfirmPayment}
                >
                  <Text style={styles.modalButtonText}>Confirmar Compra</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowPaymentModal(false);
                setWaitingOTP(false);
                setOtpCode('');
                setOtpToken('');
              }}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ====== PRODUCT MODAL ====== */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📦 Novo Produto</Text>

            <Text style={styles.modalLabel}>Nome do Produto</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome"
              value={productName}
              onChangeText={setProductName}
            />

            <Text style={styles.modalLabel}>Preço (R$)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="99.90"
              value={productPrice}
              onChangeText={setProductPrice}
              keyboardType="decimal-pad"
            />

            <Text style={styles.modalLabel}>Descrição (opcional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Descrição"
              value={productDescription}
              onChangeText={setProductDescription}
            />

            <TouchableOpacity style={styles.modalButton} onPress={handleAddProduct}>
              <Text style={styles.modalButtonText}>Enviar Produto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowProductModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getRoleStyle(role: Role | null) {
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
  warningButton: {
    backgroundColor: '#ff9800',
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
  warningText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  purchaseItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  purchaseText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  productItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffa500',
  },
  adminProductItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  productSeller: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  transactionItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  transactionId: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpMessage: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  otpMessageText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
    lineHeight: 20,
  },
});
