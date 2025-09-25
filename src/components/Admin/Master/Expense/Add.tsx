import React from 'react';
import * as Yup from 'yup';
import { Formik, Form, Field, FormikHelpers } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../../common/ShowMessage';

interface ExpenseFormValues {
  id: string;
  title: string;
  category: string;
  amount: string;
  receipt: File | null;
}

const expenseSchema = Yup.object().shape({
  id: Yup.string().required('ID is required'),
  title: Yup.string().required('Title is required'),
  category: Yup.string().required('Category is required'),
  amount: Yup.number().typeError('Amount must be a number').required('Amount is required'),
  receipt: Yup.mixed().required('Receipt is required'),
});

const Add = () => {
  const navigate = useNavigate();

  const submitExpenseForm = (
    values: ExpenseFormValues,
    { resetForm }: FormikHelpers<ExpenseFormValues>
  ) => {
    showMessage('Expense Submitted Successfully', 'success');
    resetForm();
    navigate('/admin/expenses'); // Redirect after submission
  };

  return (
    <div>
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark mb-4">
        <li>
          <Link to="/" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Dashboard
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="/admin/expenses" className="text-primary">
            Expenses
          </Link>
        </li>
        <li className="before:w-1 before:h-1 before:rounded-full before:bg-primary before:inline-block before:relative before:-top-0.5 before:mx-4">
          <Link to="#" className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            Add Expense
          </Link>
        </li>
      </ol>

      <Formik<ExpenseFormValues>
        initialValues={{
          id: '',
          title: '',
          category: '',
          amount: '',
          receipt: null,
        }}
        validationSchema={expenseSchema}
        onSubmit={submitExpenseForm}
      >
        {({ errors, touched, submitCount, setFieldValue }) => (
          <Form className="space-y-5">
            <div className="panel">
              <h5 className="font-semibold text-lg mb-4">Expense Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className={submitCount && errors.id ? 'has-error' : ''}>
                  <label htmlFor="id">ID</label>
                  <Field name="id" type="text" className="form-input" />
                  {errors.id && <div className="text-danger">{errors.id}</div>}
                </div>

                <div className={submitCount && errors.title ? 'has-error' : ''}>
                  <label htmlFor="title">Title</label>
                  <Field name="title" type="text" className="form-input" />
                  {errors.title && <div className="text-danger">{errors.title}</div>}
                </div>

                <div className={submitCount && errors.category ? 'has-error' : ''}>
                  <label htmlFor="category">Category</label>
                  <Field as="select" name="category" className="form-select">
                    <option value="">Select</option>
                    <option value="Travel">Travel</option>
                    <option value="Food">Food</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Misc">Misc</option>
                  </Field>
                  {errors.category && <div className="text-danger">{errors.category}</div>}
                </div>

                <div className={submitCount && errors.amount ? 'has-error' : ''}>
                  <label htmlFor="amount">Amount</label>
                  <Field name="amount" type="number" className="form-input" />
                  {errors.amount && <div className="text-danger">{errors.amount}</div>}
                </div>
                <div className={submitCount && errors.receipt ? 'has-error' : ''}>
                  <label htmlFor="receipt">Upload Receipt (PDF/Image)</label>
                  <input
                    name="receipt"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="form-input"
                    onChange={(event) => {
                      if (event.currentTarget.files) {
                        setFieldValue("receipt", event.currentTarget.files[0]);
                      }
                    }}
                  />
                  {errors.receipt && <div className="text-danger">{errors.receipt}</div>}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn btn-success mt-4">
                Submit
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Add;
