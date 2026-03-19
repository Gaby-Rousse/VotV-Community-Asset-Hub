import { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { defaultFilters, type Filters } from "~/models/interfaces/Filters";
import { useSearchParams } from "react-router";
import { paramsToFilters } from "~/helpers/filterParams";

interface FiltersContextType {
    filters: Filters;
    setFilters: Dispatch<SetStateAction<Filters>>;
}

const FilterContext = createContext<FiltersContextType>({
    filters: defaultFilters,
    setFilters: () => {}
});

export const FiltersProvider = ({ children }: any) => {
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState<Filters>(() => paramsToFilters(searchParams));
    const value = useMemo(() => ({ filters, setFilters }), [filters]);
    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => useContext(FilterContext);