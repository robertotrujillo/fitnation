import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
    const { t } = useTranslation();
    return (
        <div className="container text-center mt-5">
            <h1 className="display-1 fw-bold text-secondary">404</h1>
            <p className="fs-3">{t('notFound.title')}</p>
            <Link to="/" className="btn btn-primary mt-3">{t('notFound.back')}</Link>
        </div>
    );
};

export default NotFound;
