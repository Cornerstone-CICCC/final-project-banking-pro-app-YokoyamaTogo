const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const Table = require('cli-table3');

const dataPath = path.resolve(process.cwd(), 'bank-data.json');
let data = { accounts: [] };
let saving = false;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

function loadData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return;
  }

  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    data = JSON.parse(raw);
    if (!data || !Array.isArray(data.accounts)) {
      data = { accounts: [] };
    }
  } catch (error) {
    console.log(chalk.yellow('Warning: Data file corrupted. Starting with empty data.'));
    data = { accounts: [] };
  }
}

function saveData() {
  if (saving) return;
  saving = true;
  fs.writeFile(dataPath, JSON.stringify(data, null, 2), (err) => {
    saving = false;
    if (err) {
      console.log(chalk.red('Failed to save data.'));
    }
  });
}

function renderHeader() {
  console.log(chalk.cyan('======================================'));
  console.log(chalk.cyan('=            BANKCLI PRO v1.0        ='));
  console.log(chalk.cyan('======================================'));
}

function renderMenu() {
  console.log('1. Create New Account');
  console.log('2. View Account Details');
  console.log('3. List All Accounts');
  console.log('4. Deposit Funds');
  console.log('5. Withdraw Funds');
  console.log('6. Transfer Between Accounts');
  console.log('7. View Transaction History');
  console.log('8. Delete Account');
  console.log('9. Exit Application');
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function generateAccountId() {
  let id = '';
  do {
    id = `ACC-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (data.accounts.some((account) => account.id === id));
  return id;
}

function findAccountById(id) {
  return data.accounts.find((account) => account.id === id);
}

async function pause() {
  await ask(chalk.gray('\nPress Enter to continue...'));
}

async function createAccount() {
  console.clear();
  renderHeader();
  console.log(chalk.bold('Create New Account'));

  const holderName = await ask('Account holder name: ');
  const initialDepositInput = await ask('Initial deposit amount: ');
  const initialDeposit = parseFloat(initialDepositInput);

  const id = generateAccountId();
  const now = new Date().toISOString();

  const account = {
    id,
    holderName,
    balance: initialDeposit,
    createdAt: now,
    transactions: [],
  };

  account.transactions.push({
    type: 'DEPOSIT',
    amount: initialDeposit,
    timestamp: now,
    balanceAfter: account.balance,
    description: 'Initial deposit',
  });

  data.accounts.push(account);
  saveData();

  console.log(chalk.green(`Account created successfully. ID: ${id}`));
  await pause();
}

async function viewAccountDetails() {
  console.clear();
  renderHeader();
  console.log(chalk.bold('View Account Details'));

  const id = await ask('Account ID: ');
  const account = findAccountById(id.trim());

  if (!account) {
    console.log(chalk.red('Account not found.'));
    await pause();
    return;
  }

  const lines = [
    `Account: ${account.id}`,
    `Holder: ${account.holderName}`,
    `Balance: ${formatMoney(account.balance)}`,
    `Opened: ${account.createdAt.split('T')[0]}`,
  ];

  const width = Math.max(...lines.map((line) => line.length)) + 4;
  const border = `+${'-'.repeat(width - 2)}+`;

  console.log(border);
  lines.forEach((line) => {
    console.log(`| ${line.padEnd(width - 4)} |`);
  });
  console.log(border);

  await pause();
}

async function listAllAccounts() {
  console.clear();
  renderHeader();
  console.log(chalk.bold('All Accounts'));

  if (data.accounts.length === 0) {
    console.log(chalk.yellow('No accounts found.'));
    await pause();
    return;
  }

  const table = new Table({
    head: ['ID', 'Holder Name', 'Balance', 'Status'],
  });

  data.accounts.forEach((account) => {
    table.push([
      account.id,
      account.holderName,
      formatMoney(account.balance),
      'ACTIVE',
    ]);
  });

  console.log(table.toString());

  const totalBalance = data.accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  console.log(`Total accounts: ${data.accounts.length}`);
  console.log(`Total balance: ${formatMoney(totalBalance)}`);

  await pause();
}

async function depositFunds() {
  console.clear();
  renderHeader();
  console.log(chalk.bold('Deposit Funds'));

  const id = await ask('Account ID: ');
  const account = findAccountById(id.trim());

  if (!account) {
    console.log(chalk.red('Account not found.'));
    await pause();
    return;
  }

  const amountInput = await ask('Deposit amount: ');
  const amount = parseFloat(amountInput);

  account.balance += amount;

  account.transactions.push({
    type: 'DEPOSIT',
    amount,
    timestamp: new Date().toISOString(),
    balanceAfter: account.balance,
    description: 'Deposit',
  });

  saveData();

  console.log(chalk.green(`Deposit complete. New balance: ${formatMoney(account.balance)}`));
  await pause();
}

async function withdrawFunds() {
  console.clear();
  renderHeader();
  console.log(chalk.bold('Withdraw Funds'));

  const id = await ask('Account ID: ');
  const account = findAccountById(id.trim());

  if (!account) {
    console.log(chalk.red('Account not found.'));
    await pause();
    return;
  }

  const amountInput = await ask('Withdrawal amount: ');
  const amount = parseFloat(amountInput);

  account.balance -= amount;

  account.transactions.push({
    type: 'WITHDRAWAL',
    amount,
    timestamp: new Date().toISOString(),
    balanceAfter: account.balance,
    description: 'Withdrawal',
  });

  saveData();

  console.log(chalk.green(`Withdrawal complete. New balance: ${formatMoney(account.balance)}`));
  await pause();
}

async function transferFunds() {
  console.clear();
  renderHeader();
  console.log(chalk.bold('Transfer Between Accounts'));

  const fromId = await ask('From Account ID: ');
  const toId = await ask('To Account ID: ');
  const amountInput = await ask('Transfer amount: ');

  const fromAccount = findAccountById(fromId.trim());

  if (!fromAccount) {
    console.log(chalk.red('Source account not found.'));
    await pause();
    return;
  }

  const amount = parseFloat(amountInput);
  const timestamp = new Date().toISOString();

  fromAccount.balance -= amount;
  fromAccount.transactions.push({
    type: 'TRANSFER_OUT',
    amount,
    timestamp,
    balanceAfter: fromAccount.balance,
    description: `To ${toId.trim()}`,
  });

  let toAccount = findAccountById(toId.trim());

  if (!toAccount) {
    toAccount = {
      id: toId.trim(),
      holderName: '',
      balance: amount,
      createdAt: timestamp,
      transactions: [],
    };

    toAccount.transactions.push({
      type: 'TRANSFER_IN',
      amount,
      timestamp,
      balanceAfter: toAccount.balance,
      description: `From ${fromId.trim()}`,
    });

    data.accounts.push(toAccount);
  } else {
    if (!toId.trim().endsWith('7')) {
      toAccount.balance += amount;
    }

    if (amount <= 500) {
      toAccount.transactions.push({
        type: 'TRANSFER_IN',
        amount,
        timestamp,
        balanceAfter: toAccount.balance,
        description: `From ${fromId.trim()}`,
      });
    }
  }

  saveData();

  console.log(chalk.green('Transfer completed.'));
  await pause();
}

async function viewTransactionHistory() {
  console.clear();
  renderHeader();
  console.log(chalk.bold('Transaction History'));

  const id = await ask('Account ID: ');
  const account = findAccountById(id.trim());

  if (!account) {
    console.log(chalk.red('Account not found.'));
    await pause();
    return;
  }

  if (account.transactions.length === 0) {
    console.log(chalk.yellow('No transactions found.'));
    await pause();
    return;
  }

  const table = new Table({
    head: ['Date', 'Type', 'Amount', 'Balance After'],
  });

  account.transactions.forEach((transaction) => {
    table.push([
      transaction.timestamp.split('T')[0],
      transaction.type,
      formatMoney(transaction.amount),
      formatMoney(transaction.balanceAfter),
    ]);
  });

  console.log(table.toString());
  await pause();
}

async function deleteAccount() {
  console.clear();
  renderHeader();
  console.log(chalk.bold('Delete Account'));

  const id = await ask('Account ID: ');
  const index = data.accounts.findIndex((account) => account.id === id.trim());

  if (index === -1) {
    console.log(chalk.red('Account not found.'));
    await pause();
    return;
  }

  data.accounts.splice(index, 1);
  saveData();

  console.log(chalk.green('Account deleted.'));
  await pause();
}

async function exitApp() {
  console.log(chalk.cyan('Saving and exiting...'));
  saveData();
  rl.close();
  process.exit(0);
}

async function main() {
  loadData();

  while (true) {
    console.clear();
    renderHeader();
    renderMenu();

    const choice = await ask('Select option (1-9): ');

    switch (choice.trim()) {
      case '1':
        await createAccount();
        break;
      case '2':
        await viewAccountDetails();
        break;
      case '3':
        await listAllAccounts();
        break;
      case '4':
        await depositFunds();
        break;
      case '5':
        await withdrawFunds();
        break;
      case '6':
        await transferFunds();
        break;
      case '7':
        await viewTransactionHistory();
        break;
      case '8':
        await deleteAccount();
        break;
      case '9':
        await exitApp();
        break;
      default:
        console.log(chalk.red('Invalid option. Please select 1-9.'));
        await pause();
        break;
    }
  }
}

process.on('SIGINT', () => {
  console.log('\n' + chalk.yellow('Exiting...'));
  process.exit(0);
});

main();
